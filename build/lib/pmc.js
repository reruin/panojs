var UglifyJS = require('uglify-js'),
    fs = require('fs'),
    path = require('path'),
    iconv = require('iconv-lite');



module.exports = {
    config : function(config){
        new Compiler(config);
    }
}

function scanFolder(path){
    path = path.replace(/\/$/,'');

    var fileList = [],
        folderList = [],
        walk = function(path, fileList, folderList){
            files = fs.readdirSync(path);
            files.forEach(function(item) {
                var tmpPath = path + '/' + item,
                    stats = fs.statSync(tmpPath);

                if (stats.isDirectory()) {
                    walk(tmpPath, fileList, folderList);
                    folderList.push(tmpPath);
                } else {
                    fileList.push(tmpPath);
                }
            });
        };

    walk(path, fileList, folderList);

    //console.log('扫描' + path +'成功');

    return {
        'files': fileList,
        'folders': folderList
    }
}


function Compiler(a){
    console.log('P.js build tool ');
	this.list = [];
    this.config = a;
	this.build();
}

Compiler.prototype = {
    config: {},

    find: function (mod) {
        for (var i=this.list.length;i--;) {
            if (this.list[i].name == mod) return i;
        }
        return -1;
    },

    swap : function(a , b){
        console.log('     swap : '+a+","+b)
        var tmp = this.list[a];
        this.list[a] = this.list[b];
        this.list[b] = tmp;
    },

    add: function (mod, from) {
        //如果不存在
        if (this.find(mod) == -1) {
            // 默认 push，插在最后
            if (from == undefined) from = this.list.length;
            this.list.splice(from, 0, {
                name: mod, path: this.path(mod)
            });
            console.log('\x1B[36m%s\x1B[0m', ' ----> add : '+this.find(mod)+'('+mod+')')

        }
        return this.find(mod);
    },

    path: function (mod) {
        return this.config.src + '/' + mod.replace('P.','').replace(/\./g,'/') + '.js';
        //return this.config.path + "/" + mod + ".js";
    },


    build: function () {
        var inputFilePath = this.config.src,
            dist = this.config.dist,
            output = this.config.output,
            base = this.config.base,
            self = this;


        var combineFile = dist + "/" +(output || 'main');

        this.add('P');

        if(base) {

            this.analyze(base);
            this.link(inputFilePath,combineFile);
            return;
        }else{
            var list = scanFolder(inputFilePath);

            list.files.forEach(function (file) {
                //console.log("analyze file:"+file);
                if (file.indexOf(".js") != -1) {
                    console.log(file)
                    var mod = file.replace(inputFilePath,'').replace(/\//g,'.').replace(".js",'').replace(/^\./g,'');
                    //if(mod != output+'.') mod = 'P'+mod;
                    if(mod != 'P') mod = 'P.'+mod;
                    console.log('\x1B[33m%s\x1b[0m:', mod);
                    self.analyze(mod);
                }
            });
            this.link(inputFilePath,combineFile);

        }

    },

    link : function(inputFilePath,combineFile){
        var outputCharset = "utf8";

        var fd = fs.openSync(combineFile+".js", 'w');
        var combinedComment = "/*PMC*/\r\n";
        var combinedCommentBuffer = iconv.encode(combinedComment, outputCharset);
        fs.writeSync(fd, combinedCommentBuffer, 0, combinedCommentBuffer.length);
        fs.closeSync(fd);



        fd = fs.openSync(combineFile+".js", 'a');

        console.log("total:"+this.list.length)
        for (var i = 0; i < this.list.length; i++) {
            console.log(this.list[i].name);
            var modContent = this.content(this.list[i]) + "\r\n";
            var buffer = iconv.encode(modContent, outputCharset);
            fs.writeSync(fd, buffer, 0, buffer.length);
        }
        fs.closeSync(fd);

        console.info('[ok]' + ' %s ===> %s', inputFilePath, combineFile+".js");

        var modContent = fs.readFileSync(combineFile+".js",'utf8');

        var result = UglifyJS.minify(modContent, {fromString: true});

        /*var ast = UglifyJS.parse(modContent);

         ast = UglifyJS.ast_mangle(ast);

         ast = UglifyJS.ast_squeeze(ast);*/

        fs.writeFileSync(combineFile+"_min.js", result.code, 'utf8');

        console.info('[ok]' + ' minify ===> %s', combineFile+"_min.js");

        var arr = [];
        for(var i in this.list){
            var t = typeof(this.list[i]) == "string" ? this.list[i] : this.list[i].name;
            arr.push(t.replace(/P\./,"").replace(/\./g,'/'));
        }
        var debug = '(function(){var mods = ["' + arr.join('","') + '"];var tpl="<script type=\'text/javascript\' src=\'../src/{url}.js?{stamp}\'><\/script>";for(var i in mods){document.write(tpl.replace("{url}",mods[i]));}}());';

        fs.writeFileSync(combineFile+"_debug.js", debug, 'utf8');
    }
    ,
    //分析路径
    analyzePath: function (path , fn) {
        //console.log("analyze:"+path);
        var self = this;

        /*path = path.replace(/\/$/,'');

        var fileList = [],
            folderList = [],
            walk = function(path, fileList, folderList){
                files = fs.readdirSync(path);
                files.forEach(function(item) {
                    var tmpPath = path + '/' + item,
                        stats = fs.statSync(tmpPath);

                    if (stats.isDirectory()) {
                        walk(tmpPath, fileList, folderList);
                        folderList.push(tmpPath);
                    } else {
                        fileList.push(tmpPath);
                    }
                });
            };

        walk(path, fileList, folderList);*/

        fs.readdir(path, function (err, files) {
            //err 为错误 , files 文件名列表包含文件夹与文件
            /* if(err){
             console.log('error:miss path["' + err+'"');
             return;
             }*/
            files.forEach(function (file) {
                //console.log("analyze file:"+file);
                if (file.indexOf(".js") != -1) {
                    var mod = file.split(".js")[0];
                    self.analyze(mod);
                }
            });

            fn();
        });
    },
	
    //读取内容
	content:function(mod){
        //console.log(typeof(mod))
		var file = typeof(mod) == "string" ? this.path(mod) : mod.path;
        //console.log("read : " + file);
		var fileContent = fs.readFileSync(file);
        var modContent = iconv.decode(fileContent, "utf8");
		//remove file BOM
		if(/^\uFEFF/.test(modContent)){
			modContent = modContent.toString().replace(/^\uFEFF/, '');
		}

		return modContent;
	},

	analyze : function(mod , parent){
        // 检测列表
		var pos = this.find(mod);

        //不在列表中
		if( pos == -1)
		{
			//添加到列表
            var index;
            //添加到 上级之前
            if(parent) index = this.find(parent);
			pos = this.add(mod , index);

            console.log('---- analyze:'+mod+',parent:'+index);

            //读取内容
			var moduleContent = this.content(mod);

            var dep_a = [], sub_mod;
            //截取头
			var start = moduleContent.indexOf('P.module(');
            if(start != -1) {
                start = moduleContent.indexOf('[', start);
                var end = moduleContent.indexOf(']', start);
                var dep = moduleContent.substring(start + 1, end);//

                if(dep!=""){
                    dep_a = dep.replace(/[\'\"\s]/g, "").split(",");
                }

            }

            //包内require
            var reg = /require\([\'\"]([^\'\"]+?)[\'\"]\)/gi, m;
            moduleContent = moduleContent.replace(/\s/g,'');

            while(m = reg.exec(moduleContent))  dep_a.push(m[1]);

            // 查找依赖
            for (var i = 0; i < dep_a.length; i++) {
                sub_mod = dep_a[i];
                console.log('  ---- find:'+sub_mod);
                //迭代分析子项
                this.analyze(sub_mod, mod);
            }

            //var c_m = moduleContent.replace(/\s/g,'').match(/require\([\'\"]([^\'\"]+?)[\'\"]\)/g);
/*            console.log(c_m)
            if(c_m){
                console.log(c_m.length);
            }*/
		}else{
            //已添加到列表，根据依赖关系 前置
            if(parent){
                var p_i = this.find(parent);

                if(p_i >=0 && p_i<pos) {
                    console.log('before swap  ---- exist:'+this.find(mod)+',parent:'+this.find(parent)+'('+this.list[this.find(parent)].name+')');
                    this.swap(p_i,pos);
                    console.log('swap  ---- exist:'+this.find(mod)+',parent:'+this.find(parent)+'('+this.list[this.find(parent)].name+')');
                }

            }



            //this.sort();
        }
	}
}
//  console.log('----add : '+this.list.length+'('+mod+')');