Template.Slider.onRendered(function(){
  let self = this.data;
  let slider = this.$(`[id='${self._id}']`)
  //console.log(self);
  slider.noUiSlider({
    start: self.start,
    connect: 'lower',
    range:self.range,
    format: wNumb({decimals: 0})
  })
  .on('slide', function (ev, val) {
    if(!Outputs.findOne({'outputs.id':self.id}).value){
      if(!Settings.findOne({_id:'Services'}).isBusy){
        Meteor.call('configureOutputs',self._id,self.id,val,function(error,result){
          if(error){
            Messages.newErrorMsg(error)
            return;
          }
          if(result && result !== 'success'){
            Messages.newErrorMsg(result);
            ChangeSliderValue(self);
            return;
          }
        });
      }
    }else{
      Messages.newErrorMsg(new Meteor.Error(402, "Can't change value while it's automatic"))
      ChangeSliderValue(self);
    }
    //Meteor.call('Outputs.update',self._id,self.id,val);
  })
  .on('change',function(ev,val){
    if(!Outputs.findOne({'outputs.id':self.id}).value){
      Meteor.call('configureOutputs',self._id,self.id,val,function(error,result){
        if(error){
          Messages.newErrorMsg(error)
          return;
        }
        if(result && result !== 'success'){
          Messages.newErrorMsg(result);
          ChangeSliderValue(self);
          return;
        }
      });
    }else{
      Messages.newErrorMsg(new Meteor.Error(402, "Can't change value while it's automatic"))
      ChangeSliderValue(self);
    }
  })
});

ChangeSliderValue = function(self){
  Outputs.findOne({'outputs.id':self.id},{fields:{'outputs.id':1,'outputs.start':1,_id:0}})
  .outputs.map(function(output){
    if(self.id == output.id){
      $(`[id='${self._id}'].slider`).val(output.start)
    }
  })
}
