let backup = Npm.require('mongodb-backup');
var restore = Npm.require('mongodb-restore');
var fs = Npm.require('fs');

WebApp.connectHandlers.use('/database/backup',function(req,res,next){
  if(req.method ==='GET'){
    res.writeHead(200, { 'Content-Type': 'application/x-tar' });
    backup({
      uri: process.env.MONGO_URL || 'mongodb://localhost:3001/meteor',
      // mongodb://<dbuser>:<dbpassword>@<dbdomain>.mongolab.com:<dbport>/<dbdatabase>
      //root: '/home/sunderhus/Desktop/Dump',
      stream:res,
      tar:'backup.tar',
      callback:function(){
        res.end();
      }
    })
  }
  //next()
})

WebApp.connectHandlers.use('/database/restore',function(req,res,next){
  if(req.method ==='POST'){
    let file = fs.createWriteStream('./dump.tar');
    file.on('error',function(error){
      console.log('errr: ' + error);
    });
    file.on('finish',Meteor.bindEnvironment(function(){
      res.writeHead(204);
      res.end(); //end the respone
      restore({
        uri: process.env.MONGO_URL || 'mongodb://localhost:3001/meteor',
        root:'./',
        tar:'dump.tar',
        drop:true,
        callback:Meteor.bindEnvironment(function(err){
          fs.unlink('./dump.tar',Meteor.bindEnvironment(function (err){
            if (err) throw err;
            }));
          })
        })
      }));
      req.pipe(file); //pipe the request to the file
    }
  })

  WebApp.connectHandlers.use('/database/samples/csv',function(req,res,next){
    if(req.method ==='GET'){
      res.writeHead(200, { 'Content-Type': 'text/csv' });
      Meteor.call('DbToCSV',Meteor.bindEnvironment(function(error,result){
        if(error) throw error;
        res.write(result)
      }))
      res.end()
    }
  })


  cleanDatabase = function(){
  	let currentTime = moment().subtract(1,'days').endOf('day').valueOf();
  	let observe = Analysis.find({firstDate:{$lt:currentTime}}).observe({
  		added:function(doc){
  			Analysis.remove({_id:doc._id});
  			Samples.remove({_id:{$regex:new RegExp(doc._id+'$'),$options:'m'}})
  		}
  	})
  	Meteor.setInterval(function(){
  		observe.stop();
  		teste();
  	}, 8.64e+7/*One Day in milliseconds*/)
  }
