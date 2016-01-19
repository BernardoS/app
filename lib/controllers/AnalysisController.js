AnalysisController = {
  insert(firstDate,{value}){
    let analysis = new AnalysisClass({firstDate,frequency:value});
    Analysis.insert(analysis)
    return analysis
  },
  _expand({firstDate,frequency,counter,virtual}){
    let analysis = new AnalysisClass({
      firstDate: firstDate + (Math.floor(counter/Math.floor(60*60000/frequency))+1)*3.6e+6,
      frequency,
      virtual:counter+(virtual||0)+1
    });
    Analysis.insert(analysis)
  },
  update(analysis,{counter}){
    let {firstDate} = analysis;
    counter = counter - (analysis.virtual||0)
    Analysis.update({_id:analysis._id},{$set:{counter,firstDate}});
  },
  removeEmpty(){
    Analysis.remove({counter:-1})
  },
  dataReceived({data,date,counter}){
    let analysis = Analysis.findOne({},{sort:{firstDate:-1}});
    if(!analysis.firstDate){
      analysis.setWithDelay({date,counter})
    }
    const difference = analysis.difference(counter)
    if(difference > 0){
      let aux = analysis.counter+(Math.floor(60*60000/analysis.frequency));
      for (let i = 0; i < difference-1; i++){
        SamplesController.insert(analysis,{counter:aux})
        aux = aux + (Math.floor(60*60000/analysis.frequency));
      }
      SamplesController.insert(analysis,{data,counter})
    }else{
      SamplesController.update(analysis,{data,counter})
    }
    this.update(analysis,{counter})
    if(analysis.isLastCounter()){
      this._expand(analysis)
    }
  }
}
