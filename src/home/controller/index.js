'use strict';

import Base from './base.js';

export default class extends Base {
    //列表页
    async indexAction() {
            this.assign('title', "首页");
            let page = this.get('page') ? this.get('page') : 1;
            let map = {};
            if (this.post('keyword')) { //关键词
                map = {
                    'ey_contents.title': ['like', '%' + this.post('keyword') + '%']
                };
                this.assign('title', "搜索");
            }
            if (this.get('tag')) { //标签
                map = {
                    'ey_contents.tid': this.get('tag')
                };
                this.assign('title', "标签");
            }
            if (this.get('cate')) { //分类
                map = {
                    'ey_contents.cid': this.get('cate')
                };
                this.assign('title', "分类");
            }
            map.ispage = 1;
            map.status = 1;
            let data = await this.model('contents').getList(map, page, 6);
            /*
             *注1：此处略坑，因为之前使用ID做文章标识，为了兼容之前的数据才这样写的
             */
            for (let k in data['data']) {
                if (!think.isEmpty(data['data'][k]['url'])) {
                    data['data'][k]['id'] = data['data'][k]['url'];
                }
            }
            this.assign('list', data);
            this.display();
        }
        //详情页
    async pageAction() {
            let map = {
                status: 1,
                'ey_contents.id|ey_contents.url': this.get('id') //注1
            };
            let data = await this.model('contents').getOne(map);
            if (!think.isEmpty(data.url)) {
                data.id = data.url;
            }
            this.assign('title', data.title);
            this.assign('data', data);
            //阅读量+1
            this.model('contents').where(map).increment('view');
            this.display();
        }
        //归档页
    async archivesAction() {
            this.assign('title', '归档');
            let data = await this.model('contents')
                .where("ispage=1 AND status=1")
                .field("id,title,time,view,url")
                .order("time desc")
                .select();
            //注1
            for (let k in data) {
                data[k]['time'] = formatDate("y-m-d h:i:s", data[k]['time']);
                if (!think.isEmpty(data[k]['url'])) {
                    data[k]['id'] = data[k]['url'];
                }
            }
            this.assign('data', data);
            this.display();
        }
        //登录
    async loginAction() {
            if (this.isGet()) {
                //判断是否登录
                let data = await this.session('userInfo');
                if (!think.isEmpty(data)) {
                    this.redirect("/admin");
                } else {
                    this.assign('title', "登录到后台");
                    this.display();
                }
            } else {
                let map = {
                    user: this.post('user'),
                    pass: this.post('pass')
                };
                if (!map.user || !map.pass) {
                    this.end({ status: -1, "msg": "帐号和密码不能为空" });
                }
                let data = await this.model('users').login(map);
                if (!think.isEmpty(data)) {
                    //设置session
                    await this.session('userInfo', data);
                    return this.redirect("/admin");
                } else {
                    return this.redirect("/login");
                }
            }
        }
        //获取token
    async gettokenAction() {
            let map = {
                user: this.post('user'),
                pass: this.post('password')
            };
            if (!map.user || !map.pass) {
                this.end({ status: -1, "msg": "帐号和密码不能为空" });
            }
            let data = await this.model('users').login(map);
            if (!think.isEmpty(data)) {
                this.end({ status: 1, "msg": "登录成功", token: think.md5(time()) });
            } else {
                this.end({ status: -1, "msg": "登录鉴权失败" });
            }
        }
        //异常页
    async errorAction() {
            this.assign('title', '未找到该信息');
            this.display();
        }
        //获取信息
    async locationAction() {
    	let self=this;
        let request = think.require('request');
        let lat = this.post('lat');
        let lng = this.post('lng');
        //判断24小时内有没有访问
        let map = {
            ip: this.ip()
        }
        let rs = await this.model('count').where(map).order('id desc').find();
        if (!think.isEmpty(rs)) {
            let url = 'http://api.map.baidu.com/geocoder/v2/?location=' + lat + ',' + lng + '&output=json&ak=03Fck6nmhF4cSGG8gx1GQDBt';
            request(url, function(error, response, body) {
                if (!error && response.statusCode == 200) {
                	let res=JSON.parse(body);
                	if(res.status==0){
	                	let data={
				                lat: lat,
				                lng: lng,
				                location:body,
				                address:res.result.formatted_address
				            };
				        self.model('count').where({'id': rs.id }).update(data);
                	}
                }
            });
        }
        this.end();
    }
}
