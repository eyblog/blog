'use strict';

import Base from './base.js';

export default class extends Base {
    //首页
    async indexAction() {
        //获取上传信息
        let file = this.file("file");
        //引入fs处理文件 
        let fs = think.require('fs'); 
        //引入path处理文件名
        let path = think.require('path');
        //文件名
        let filename = path.basename(file.path);
        //保存目录
        let uploadPath = think.RESOURCE_PATH + '/static/upload';
        //创建目录
        think.mkdir(uploadPath);
        //新文件名
        let basename=think.md5(filename)+path.extname(file.path);//path.extname获取文件后缀名，可做控制
        //移动文件
        fs.renameSync(file.path, uploadPath + '/' + basename);
        //输出文件路径
        this.end('/static/upload/' + basename);
    }
    //markdown编辑器上传
    async markdownAction() {
        var self=this;
        //获取上传信息
        let file = this.file("editormd-image-file");
        //引入fs处理文件 
        let fs = think.require('fs'); 
        //引入path处理文件名
        let path = think.require('path');
        //文件名
        let filename = path.basename(file.path);
        //保存目录
        let uploadPath = think.RESOURCE_PATH + '/static/upload';
        //创建目录
        think.mkdir(uploadPath);
        //新文件名
        let basename=think.md5(filename)+path.extname(file.path);//path.extname获取文件后缀名，可做控制
        //移动文件
        fs.renameSync(file.path, uploadPath + '/' + basename);

        var files='/static/upload/' + basename;
        //获取配置
        let config = await this.cache("config", () => {
            return this.getConfig();
        });
        config=JSON.parse(config);

        if(think.isEmpty(config.qnbucket)||think.isEmpty(config.qnaccess)||think.isEmpty(config.qnsecret)){
            self.end({success:1,message:"上传成功",url:files});//没有配置七牛信息则使用本地地址
        }   
        //七牛上传
        var qiniu = think.require("qiniu");
        qiniu.conf.ACCESS_KEY = config.qnaccess;
        qiniu.conf.SECRET_KEY = config.qnsecret;
        var putPolicy = new qiniu.rs.PutPolicy(config.qnbucket+":"+basename);

        var token = putPolicy.token();
        var extra = new qiniu.io.PutExtra();
        qiniu.io.putFile(token, basename, think.RESOURCE_PATH+files, extra, function(err, ret) {
            if(!err) {
                self.end({success:1,message:"上传成功",url:config.qnweb + ret.key});                 
            } else {
                console.log(err);
                self.end({success:1,message:"上传成功",url:files});//上传失败使用本地地址
            }
        });
    }
}