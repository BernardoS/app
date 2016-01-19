
Meteor.startup(function () {
	HANDLE = undefined;
	Meteor.call('createAdmin');
	Meteor.call('getTemperatures')
	//initialize();
	Services.initialize(function(){})
	cleanDatabase();

	/*Settings.find({_id:'SamplingState'}).observe({
		changed({value,frequency}){
			if(value){
				startSampling(frequency)
			}
		}
	})*/
})

sampleOnce = function(counter){
	Services.call('sampleOnce', {}, Meteor.bindEnvironment(function(status, data) {
		if (status == 'success'){
			Settings.update({_id:'SamplingState'},{$set:{value:true}});
			let {ph,na,k,cl,conductivity} = data.result;
			let sample = {
				ph:parseFloat(((ph.raw/16384-1.65)*3.03).toFixed(3)),
				na:parseFloat(((na.raw/16384-1.65)*3.03).toFixed(3)),
				k:parseFloat(((k.raw/16384-1.65)*3.03).toFixed(3)),
				cl:parseFloat(((cl.raw/16384-1.65)*3.03).toFixed(3)),
				conductivity:parseFloat(((conductivity.raw/16384-1.65)*3.03).toFixed(3)),
				volume:0,
			}
			AnalysisController.dataReceived({data:sample,date:+moment(),counter})
		}
	}))
}


/*initialize = function(){
	Services.initialize(Meteor.bindEnvironment(function() {

		Services.on('storeSample', Meteor.bindEnvironment(function (args) {
			let data = {
				ph:parseFloat(((args.ph.raw/16384-1.65)*3.03).toFixed(3)),
				na:parseFloat(((args.na.raw/16384-1.65)*3.03).toFixed(3)),
				k:parseFloat(((args.k.raw/16384-1.65)*3.03).toFixed(3)),
				cl:parseFloat(((args.cl.raw/16384-1.65)*3.03).toFixed(3)),
				conductivity:parseFloat(((args.conductivity.raw/16384-1.65)*3.03).toFixed(3)),
				volume:0,
			}
			AnalysisController.dataReceived({data,date:+moment(),counter:args.counter})
		}))
	}))
}*/
