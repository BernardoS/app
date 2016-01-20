Template.Outputs.onCreated(function(){
  let self = this;
  this.autorun(function(){
    self.subscribe("outputsOriginal");
  });
})

Template.Outputs.helpers({
  items: function(){
    return Outputs.find({})
  },
  percentage:function(){
    let prctg = wNumb({
      decimals:0,
      postfix:'%'
    })
    return prctg.to((this.start*100)/this.range.max)
  },
  automaticButton(){
    return this.value ? 'active teal' : ''
  },
  manualButton(){
    return this.value ? '' : 'active teal'
  }
});

Template.Outputs.onRendered(function(){
  let self = this;
  this.autorun(function(){
     if(!Settings.findOne({_id:'Services'}).released){
       FlowRouter.go('/');
     }
  });
  $('.accordion').accordion({
    exclusive:false,
    selector:{
      trigger:'.title .header'
    }
  })
})
Template.Outputs.events({
  "click #automaticButton": function(event, template){
    if(!this.value){
      Meteor.call('configureLocks',{_id:this._id, id:this.id, value:1},function(error,result){
        if(error){
          Messages.newErrorMsg(error);
          return;
        }
      })
    }
  },
  "click #manualButton":function(event,template){
    if(this.value){
      Meteor.call('configureLocks',{_id:this._id, id:this.id, value:0},function(error,result){
        if(error){
          Messages.newErrorMsg(error);
          return;
        }
      })
    }
  }
});
