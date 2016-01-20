Meteor.methods({
  cleanSamples(){
    if(!Settings.findOne({_id:'Services'}).released){
      throw new Meteor.Error(402, "You're not authorized to Clean Samples");
    }
    Samples.remove({});
    Analysis.remove({});
  },
  VerifiedCreateUser(user){
    if(!this.isSimulation){
      user.connection = this.connection;
      return Accounts.createUser(user);
    }
  },
  verifyConnection(){
    if(!this.isSimulation){
      return this.connection.clientAddress === '127.0.0.1' || (Meteor.user() && Meteor.user()._createdBy === '/')
    }
  },
  DbToCSV(){
    let Data = Settings.findOne({_id:'Data'}).data;
    let data = [];
    Samples.find({}).map(function(sample,i){
      let analysis = Analysis.findOne(
        {_id:sample._id.substring(sample._id.indexOf('#')+1)}
      )
      let {timeStamp} = sample
      sample.samples.map(function(sample,i){
        if(i < analysis.counter+1){
          let momento = moment(timeStamp).add(i*analysis.frequency,'milliseconds')
          sample.Date = momento.format('DD/MM/YYYY');
          sample.Time = momento.format('HH:mm:ss');
          data.push(sample);
        }
      })
    })
    return Papa.unparse(data)
  },
  'SamplesOptions.date':function(date){
    if(moment.isDate() || !isNaN(date)){
      Options.update({_id:'SamplesOptions-'+Meteor.userId()}, {$set:{date}})
      if(this.isSimulation){
        $('#SamplesOptions-'+Meteor.userId()+'.datetimepicker').data().DateTimePicker.date(date);
      }//update the date in the DateTimePicker
    }
  },
  'messages.show'(message){
    if(this.isSimulation){
      console.log(message);
      Messages.insert(message);
    }
  },
  'messages.clear'(){
    if(this.isSimulation){
      Messages.remove({});
    }
  },
  updatePhBufferDate(){
    let date = moment().startOf('day').toDate()
    Settings.update({_id:'PhBuffer'}, {$set:{
      date:date
    }});
    if(this.isSimulation){
      if($('#PhBuffer'+'.datetimepicker').data())
        $('#PhBuffer'+'.datetimepicker').data().DateTimePicker.date(date);
    }
    return 'PhBufferMsg';
  },
  'Settings.ChangeDate'(selector,date){
    Settings.update(selector, {$set:{date}});
  },
  'Options.ChangeDate'(selector,date){
    Options.update(selector, {$set:{date}});
  },
  stopSampling(){
    if(!Settings.findOne({_id:'Services'}).released){
      throw new Meteor.Error(402, "You're not authorized to Stop sampling");
    }
    AnalysisController.removeEmpty();
    //funcao para termino de coleta
    if(!this.isSimulation){
      if(!Services.isConnected()) {
        throw new Meteor.Error(666, "MSP not connected");
      }
      Services.call('stopSampling',{}, Meteor.bindEnvironment(function(status,result){
        if(status == 'success'){
          Settings.update({_id:'SamplingState'}, {$set:{value:false}});
        }
      }));
    }
  },
  startSamplingRandomData(){
    if(!Settings.findOne({_id:'Services'}).released){
      throw new Meteor.Error(402, "You're not authorized to Start sampling");
    }
    AnalysisController.removeEmpty();
    let SamplingFreq = Options.findOne({_id:'SamplingFreq-'+Meteor.userId()})
    if(SamplingFreq.item == 'minute(s)'){
      SamplingFreq.value = SamplingFreq.value * 60
    }
    else{
      SamplingFreq.value = SamplingFreq.value
    }
    //funcao para comeco de coleta
    AnalysisController.insert(+moment(),SamplingFreq);
    Settings.update({_id:'SamplingState'}, {$set:{value:true}});
  },
  stopSamplingRandomData(){
    if(!Settings.findOne({_id:'Services'}).released){
      throw new Meteor.Error(402, "You're not authorized to Stop sampling");
    }
    AnalysisController.removeEmpty();
    Settings.update({_id:'SamplingState'}, {$set:{value:false}});
    //funcao para termino de coleta
  },
  newStartSampling(){
    if(!Settings.findOne({_id:'Services'}).released){
      throw new Meteor.Error(402, "You're not authorized to Start sampling");
    }
    AnalysisController.removeEmpty();
    let {value,item} = Options.findOne({_id:'SamplingFreq-'+Meteor.userId()})
    let frequency = item == 'minute(s)' ? value * 60 : value;
    if(!this.isSimulation){
      if(!Services.isConnected()) {
        throw new Meteor.Error(666, "MSP not connected");
      }
      let lastAnalysis = Analysis.findOne({},{sort:{firstDate:-1}})
      let momento = +moment();
      if(lastAnalysis){
        momento = +moment(lastAnalysis.firstDate+(lastAnalysis.frequency*lastAnalysis.counter) + 1.44e+7);
      }
      AnalysisController.insert(momento,{value:(frequency*1000)});
      Services.call('resetCounter', {}, Meteor.bindEnvironment(function(status) {
        if(status == 'success'){
      		let counter = 0
      		sampleOnce(counter)
      		HANDLE = Meteor.setInterval(function(){
            if(Services.isConnected()) {
              sampleOnce(++counter);
            }
      		}, frequency*1000);
        }else{
          throw new Meteor.Error(402, "Fail to reset counter");
        }
      }))
    }
  },
  newStopSampling(){
    if(!Settings.findOne({_id:'Services'}).released){
      throw new Meteor.Error(402, "You're not authorized to Stop sampling");
    }
    AnalysisController.removeEmpty();
    if(!this.isSimulation){
      Meteor.clearInterval(HANDLE);
      Settings.update({_id:'SamplingState'}, {$set:{value:false}});
    }
  },
  configureLocks({_id,id,value}){
    if(!Settings.findOne({_id:'Services'}).released){
      throw new Meteor.Error(402, "You're not authorized to configure locks");
    }
    if(!this.isSimulation){
      if(!Services.isConnected()) {
        throw new Meteor.Error(666, "MSP not connected");
      }
      Services.call('configureLocks',[{id,value}],Meteor.bindEnvironment(function(status,result){
        if(status =='success'){
          Outputs.update({_id}, {$set:{
            value
          }});
        }
      }))
    }
  },
  updateServices(){
    if(!this.isSimulation){
      if(!Settings.findOne({_id:'Services'}).released){
        throw new Meteor.Error(402,
          `You're not authorized to update Services`);
        }
        Settings.update({_id:'Services'},{$set:{isBusy:false}})
    }
  },
  'Outputs.update':function(_id,id,value){
    Outputs.update({'outputs._id':_id}, {$set:{
      'outputs.$.start':value
    }});
  },
  configureOutputs(_id,id,value){
    let services = Settings.findOne({_id:'Services'})
    if(!services.released){
      throw new Meteor.Error(402,
        `You're not authorized to configure ${Outputs.findOne({'outputs._id':_id})._id}`);
    }
    if(!this.isSimulation){
      if(!Services.isConnected()) {
        throw new Meteor.Error(666, "MSP not connected");
      }
      Settings.update({_id:'Services'}, {$set:{
        isBusy:true
      }});
      let Future = Npm.require('fibers/future');
      let future = new Future()
      Services.call(
        `configure${Outputs.findOne({'outputs._id':_id})._id}`,
        [{id,value}],
        Meteor.bindEnvironment(function(status,result){
          if(status=='success'){
            Outputs.update({'outputs._id':_id}, {$set:{
              'outputs.$.start':value
            }});
            future['return']('success');
          }
          else{
            future.throw( new Meteor.Error(402, "Can't change value while it's automatic"))
          }
      }))
      return future.wait();
    }
  }
});

if(Meteor.isServer){
  Meteor.methods({
    createAdmin(){
      if(!Meteor.users.find({}).count()){
        Accounts.createUser({
          username:'admin',
          password:'admin',
          connection:{clientAddress:'127.0.0.1'},
        })
      }
    },
    getTemperatures(){
      Meteor.setInterval(function(){
        if(Services.isConnected()) {
          Services.call('sampleOnce',{},Meteor.bindEnvironment(function(status,data){
        		if(status == 'success'){
        			let temperatures = {
        				preheater: data.result.preheater.temperature.toFixed(1),
        				heater: data.result.heater.temperature.toFixed(1)
        			}
        			Settings.update({_id:'TopMenuItems','rightItems.template':'MenuTemp'}, {$set:{
        				'rightItems.$.data.temperature':temperatures
        			}});
        		}
        	}))
        }else{
          Settings.update({_id:'TopMenuItems','rightItems.template':'MenuTemp'}, {$set:{
            'rightItems.$.data.temperature':{preheater:'--',heater:'--'}
          }});
        }
      },1000)
    }
  });
}

randomDataGenerator = function(){
  let random = function(){
    return Math.floor((Math.random() * 100) + 1);
  }
  let counter = 0
  return Meteor.setInterval(function(){
    if(Math.random() > 0){
      let date =(+moment());
      //let data = [random(), random(), random(), random(),random(),random()];
      let data = {ph:random(),na:random(),k:random(),cl:random(),volume:random(),conductivity:random()}
      AnalysisController.dataReceived({data,date,counter})
      //console.log('data: '+data+' counter: '+counter);
    }
    counter++;
  }, 2000)
}
