AnalysisClass = class AnalysisClass {
  constructor(doc){
    if(doc){
      let {frequency,firstDate,_id,virtual} = doc;
      this.counter = -1;
      if(!_id){
        this._id = new Mongo.Collection.ObjectID().valueOf();
        this.firstDate = firstDate || null;
        this.frequency = frequency;
        if(virtual != undefined)
          this.virtual = virtual;
        return;
      }
    _.extend(this,doc);
    return
    }
    throw Error('No argument passed')
  }
  setfirstDate(date){
    this.firstDate = date
  }
  setWithDelay({date,counter}){
    const delay = Math.floor(counter/Math.floor((60*60000/this.frequency)))
    this.setfirstDate(date - (delay*3.6e+6/*1 hour*/))
  }
  difference(counter){
    //this.counter = this.counter - (this.virtual||0);
    const currentV = Math.floor(this.counter/Math.floor(60*60000/this.frequency))
    counter = counter - (this.virtual||0);
    const newV = Math.floor((counter)/Math.floor(60*60000/this.frequency))
    return  (newV - currentV);
    }
  insert({data,counter}){
    let {_id,firstDate,frequency} = this
    let newPerHour = new SamplesPerHour(
      {_id,firstDate,frequency,counter}
    )
    if(data){
      newPerHour.addData(this,{data,counter})
    }
    this.counter = counter
    return newPerHour
  }
  update({data,counter}){
    const hours = Math.floor(counter/(Math.floor(60*60000/this.frequency)))
    let date = moment(this.firstDate).add(hours,'hours').format('DDMMYYYYHHmmssZZ')
    const position = (counter%(Math.floor(60*60000/this.frequency)))
    let selector = date +'#' + this._id;
    let modifier = {}
    for (var property in data) {
      if (SamplesController.format().hasOwnProperty(property)) {
        modifier['samples.'+ position + '.' + property] = data[property];
      }
    }
    this.counter = counter;
    return {selector,modifier}
  }
  isLastCounter(){
    //if the next counter represents a new day, than this is the last counter
    let {firstDate,counter,frequency} = this;
    let difference = (counter+1)/Math.floor(60*60000/frequency)*3.6e+6;
    return(!moment(firstDate).isSame((firstDate + difference),'day'));
  }
}
