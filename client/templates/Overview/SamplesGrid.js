Template.SamplesGrid.helpers({
  samples: function(){
    let analysis = Analysis.findOne({},{sort:{firstDate:-1}})
    let perHour = Samples.findOne({},{sort:{timeStamp:-1}})
    let {samples,timeStamp} = perHour || {}
    let data = Settings.findOne({_id:'Data'}).data.reduce(function(data,current){
      if(current.label){
        return [...data,current]
      }
      return data
    },[]);
    for (var i = 0; i < data.length; i++) {
      if(analysis && analysis.counter > -1 && perHour){
        data[i].value = samples[analysis.counter%Math.floor((60*60000/analysis.frequency))][data[i]._id];
        data[i].timeStamp = timeStamp;
      }else{
        data[i].value = '--'
      }
    }
    return data;
  }
});
