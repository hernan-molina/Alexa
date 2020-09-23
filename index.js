// This sample demonstrates handling intents from an Alexa skill using the Alexa Skills Kit SDK (v2).
// Please visit https://alexa.design/cookbook for additional examples on implementing slots, dialog management,
// session persistence, api calls, and more.
const Alexa = require('ask-sdk-core');
var https = require('https');


var config = {
    "projectID": "8DB28CD04256DA6D1A1809A98B411288",
    "username" : "administrator",
    "password": "mstrategy2468",
    "webserver" : "alexa.iflow21.com",
    "cubeID" : "71A7A5284292A2227A31E9A3B8CC0AF7",
};


//Replace with your app ID (OPTIONAL).  You can find this value at the top of your skill's page on http://developer.amazon.com.
//Make sure to enclose your value in quotes, like this: const APP_ID = 'amzn1.ask.skill.bb4045e6-b3e8-4133-b650-72923c5980f1';

// 'Tableros aiflow'

const APP_ID = undefined;

const SKILL_NAME = 'Tableros aiflow';
const HELP_MESSAGE = '¿En que te puedo ayudar?';
const HELP_REPROMPT = '¿En que te puedo ayudar?';
const STOP_MESSAGE = '¡Saludos!';


const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        const speakOutput = 'Hola, que información querés saber sobre aiflow';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

// cual es el valor de {metrica}
const MetricaIntentHandler = {
    canHandle(handlerInput) {
        console.log(Alexa.getIntentName(handlerInput.requestEnvelope));
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'MetricaIntentHandler';
    },
  async handle(handlerInput) {

        console.log("entro en MetricaIntentHandler");
        
        var myMetrics = handlerInput.requestEnvelope.request.intent.slots.metrica.value;
        console.log("Metrica: " +  myMetrics);
       // var MyCleanMetrics = pluralToSingular(handlerInput.requestEnvelope.request.intent.slots.metrica.value);
       // console.log("mes ID : " +  handlerInput.requestEnvelope.request.intent.slots.mes.id);

        var mes = handlerInput.requestEnvelope.request.intent.slots.mes.value;
        if (mes == null){
            mes = "actual";
        }

        console.log("mes value : " +  mes);

        var cubeId = cubeConection(mes);

        // console.log("handlerInput --: ");
        // console.log(handlerInput);

        let outputSpeech = '¿Necesitas otra información?';
        var token ='';
        var cookie='';

        // Así funciona la original
         var requiredAttributeNames = [];
         var requiredMetricNames = [myMetrics];

        await getPromiseRemoteSession()
            .then((response) => {
           // console.log('volvio de getRemoteSession con ' + response)
            console.log('cookie ' + response.cookie)
            console.log('token ' + response.token)
            token=response.token;
            cookie=response.cookie;
            })
            .catch((err) => {
                console.log('Ha ocurrido un error: ${err.message}');
                // set an optional error message here
                outputSpeech = 'Ha ocurrido un error, detalle:' + err.message;
            });
    
        await getPromiseCubeDefinition(token, cookie, cubeId)
            .then((resCubeDef)=> {
              console.log("Got resCubeDef");
              console.log(resCubeDef);
              //Have cubeDef -> now send POST to cube with desired template objects + filters
              cubeDef = resCubeDef
              
             })
            .catch((err) => {
              console.log('Ha ocurrido un error accediendo al cubo: ${err.message}');
              // set an optional error message here
               outputSpeech = 'Ha ocurrido un error accediendo al Cubo, detalle:' + err.message;
             });

        var filters = [];
        var postData = '';

        var keepGoing = true;
        try {
            postData = formCubePostData(cubeDef, requiredAttributeNames, requiredMetricNames, filters);
            
         }
         catch (e) {
            // sentencias para manejar cualquier excepción
            // outputSpeech = 'No encuentra alguna de las metricas o atributos:' + e.message;
            console.log('No encuentro alguna de las metricas o atributos:' + e.message);
            outputSpeech = 'No he comprendido tu pregunta, vuelve a preguntar' ;
            keepGoing = false;
         }

        
        if (keepGoing){
            console.log(JSON.stringify(postData));

            await getPromiseCubeData(token, cookie,cubeId, postData)
                .then((resCubeData)=> {
    
              //  outputSpeech = `My cookie is ok wuola 2. `;
                console.log("Have cube data:");
                console.log(JSON.stringify(resCubeData));
    
                var metricValue = null;
                    
                var root = resCubeData.result.data.root;
                //console.log(root);
                var child = getLastChild(root);
                console.log("last child");
                console.log(JSON.stringify(child));
                var metrics = child.metrics;
                var metricName = Object.keys(metrics)[0];
                var metric = metrics[metricName];
                metricValue = metric.fv;
                
                outputSpeech = myMetrics + " " + metricValue;
                
                console.log(outputSpeech);
    
                })
                .catch((err) => {
                    console.log('attributeID: ' + attributeID);
                   console.log(`Ha ocurrido un error, detalle:  ${err.message}`);
                // set an optional error message here
                  outputSpeech = 'Ha ocurrido un error, detalle:' + err.message;
                });

        }


        console.log(`por ultimo`);    
         return handlerInput.responseBuilder
        .speak(outputSpeech)
        .reprompt("¿Quieres saber otra información?")
        .getResponse();
    },
};

const MetricaPlantaIntentHandler = {
    canHandle(handlerInput) {
        console.log(Alexa.getIntentName(handlerInput.requestEnvelope));
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'MetricaPlantaIntentHandler';
    },
    async handle(handlerInput) {

        console.log("entro en MetricaPlantaIntentHandler");
        console.log("Metrica: " +  handlerInput.requestEnvelope.request.intent.slots.metrica.value);

       // var requiredMetricNames = [handlerInput.requestEnvelope.request.intent.slots.metrica.value.string];
        var planta = handlerInput.requestEnvelope.request.intent.slots.planta.value;
        console.log("Planta: " + planta);
        var myMetrics = handlerInput.requestEnvelope.request.intent.slots.metrica.value;

        console.log(handlerInput);

        let outputSpeech = '¿Necesitas otra información?';
        var token ='';
        var cookie='';

        // Get Cookie connection
        await getPromiseRemoteSession()
            .then((response) => {
           // console.log('volvio de getRemoteSession con ' + response)
            console.log('cookie ' + response.cookie)
            console.log('token ' + response.token)
            token=response.token;
            cookie=response.cookie;
            })
            .catch((err) => {
                console.log(`ERROR en getPromiseRemoteSession: ${err.message}`);
                // set an optional error message here
                outputSpeech = 'Ha ocurrido un error, detalle:' + err.message;
            });
    
        //Get Cube Definition    
        await getPromiseCubeDefinition(token, cookie, config.cubeID)
            .then((resCubeDef)=> {
              console.log("Got resCubeDef");
              console.log(resCubeDef);
              //Have cubeDef -> now send POST to cube with desired template objects + filters
              cubeDef = resCubeDef

            })
            .catch((err) => {
              console.log(`ERROR en getPromiseCubeDefinition: ${err.message}`);
              outputSpeech = 'Ha ocurrido un error, detalle:' + err.message;
             });



         var requiredAttributeNames = ['planta'];
         var requiredMetricNames = [];
         var filters = []
         var postData = formCubePostData(cubeDef, requiredAttributeNames, requiredMetricNames, filters);

      //   console.log('Attribute filer JSON: ' + JSON.stringify(postData));
             
         var attributeID='';

        //Get Id attribute filter
        await getPromiseCubeData(token, cookie,config.cubeID, postData)
            .then((resCubeData)=> {

      
          //  console.log("Have cube data attribute filter:");
          //  console.log(JSON.stringify(resCubeData));

            attributeID = getIDAttributeFilter(resCubeData,planta)
            
         //   console.log('attributeID: ' + attributeID);

            })
            .catch((err) => {
            console.log(`ERROR en getPromiseCubeData: ${err.message}`);
            // set an optional error message here
            outputSpeech = 'Ha ocurrido un error, detalle:' + err.message;
            });




        var requiredAttributeNames = [];
        var requiredMetricNames = [myMetrics];
        var filters = [{'name':'planta', 'element':planta, 'type':'attribute', 'id':attributeID}];

        var postData = formCubePostData(cubeDef, requiredAttributeNames, requiredMetricNames, filters);

        console.log(JSON.stringify(postData));

        //Get final Value Cube Data
        await getPromiseCubeData(token, cookie,config.cubeID, postData)
            .then((resCubeData)=> {

          //  outputSpeech = `My cookie is ok wuola 2. `;
            console.log("Have cube data:");
           // console.log(JSON.stringify(resCubeData));

            var metricValue = null;
                
            var root = resCubeData.result.data.root;
            console.log(root);
            var child = getLastChild(root);
            console.log("last child");
            console.log(JSON.stringify(child));
            var metrics = child.metrics;
            var metricName = Object.keys(metrics)[0];
            var metric = metrics[metricName];
            metricValue = metric.fv;
            
            outputSpeech =  myMetrics + ' para la planta ' + planta + ' es de ' + metricValue;
            
            console.log(outputSpeech);

            })
            .catch((err) => {
                console.log(`ERROR en getPromiseCubeData: ${err.message}`);
                // set an optional error message here
                outputSpeech = 'Ha ocurrido un error, detalle:' + err.message;
            });


        console.log(`por ultimo`);    
         return handlerInput.responseBuilder
        .speak(outputSpeech)
        .reprompt("¿Quieres saber otra información?")
        .getResponse();

    },

};


const PlantaIntentHandler = {
    canHandle(handlerInput) {
        console.log(Alexa.getIntentName(handlerInput.requestEnvelope));
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'PlantaIntentHandler';
    },
    async handle(handlerInput) {

        console.log("entro en PlantaIntentHandler");
        var myMetrics = handlerInput.requestEnvelope.request.intent.slots.metrica.value;
        console.log("Metrica: " +  myMetrics);
        var mes = handlerInput.requestEnvelope.request.intent.slots.mes.value;
        var masmenos = handlerInput.requestEnvelope.request.intent.slots.masmenos.value;
        if (mes == null){
            mes = "actual";
        }

        if (masmenos=="menos" || masmenos=="menor" ){
            masmenos="menos";
        }
        else{
            masmenos="mas";
        }
        console.log("mes value : " +  mes);
        console.log("masmenos value : " +  masmenos);

        var cubeId = cubeConection(mes);

        let outputSpeech = '¿Necesitas otra información?';
        var token ='';
        var cookie='';

        // Get Cookie connection
        await getPromiseRemoteSession()
            .then((response) => {
           // console.log('volvio de getRemoteSession con ' + response)
        //    console.log('cookie ' + response.cookie)
         //   console.log('token ' + response.token)
            token=response.token;
            cookie=response.cookie;
            })
            .catch((err) => {
                console.log(`ERROR en getPromiseRemoteSession: ${err.message}`);
                // set an optional error message here
                outputSpeech = 'Ha ocurrido un error, detalle:' + err.message;
            });
    
        //Get Cube Definition    
        await getPromiseCubeDefinition(token, cookie, cubeId)
            .then((resCubeDef)=> {
            //  console.log("Got resCubeDef");
            //  console.log(resCubeDef);
              //Have cubeDef -> now send POST to cube with desired template objects + filters
              cubeDef = resCubeDef

            })
            .catch((err) => {
              console.log(`ERROR en getPromiseCubeDefinition: ${err.message}`);
              outputSpeech = 'Ha ocurrido un error, detalle:' + err.message;
             });



         var requiredAttributeNames = ['planta'];
         var requiredMetricNames = [];
         var filters = []
         var postData = formCubePostData(cubeDef, requiredAttributeNames, requiredMetricNames, filters);

        // console.log('Attribute filer JSON: ' + JSON.stringify(postData));
             
         //var attributeID= JSON.stringify(postData).requestedObjects.attributes.id;
         //console.log(attributeID);
        var resultresCubeData='';
        var allPost = [];
         //Get Id attribute filter
        await getPromiseCubeData(token, cookie,cubeId, postData)
            .then((resCubeData)=> {

      
        //    console.log("Have cube data attribute filter:");
        //    console.log(JSON.stringify(resCubeData));
            resultresCubeData = resCubeData;

            })
            .catch((err) => {
            console.log(`ERROR en getPromiseCubeData: ${err.message}`);
            // set an optional error message here
            outputSpeech = 'Ha ocurrido un error, detalle:' + err.message;
            });


            var cubeDefAttributes = resultresCubeData.result.data.root.children;

            //console.log('getIDAttributeFilter; ' + cubeDefAttributes.length) ;
     

        var max = 0;
        if (masmenos=="menos"){
            max = Infinity;
        }
        else
        {
            max = -Infinity;
        }
        for(var i = 0; i < cubeDefAttributes.length; i++){


            var cubeDefObj = cubeDefAttributes[i];
            
            console.log('cubeDefObj; ' + cubeDefObj.element.name.toUpperCase() );
            console.log('id; ' + cubeDefObj.element.id);
            var requiredAttributeNames = [];
            var requiredMetricNames = [myMetrics];
            
            var filters = [{'name':'planta', 'element':cubeDefObj.element.name, 'type':'attribute', 'id':cubeDefObj.element.id}];

            var postData = formCubePostData(cubeDef, requiredAttributeNames, requiredMetricNames, filters);
                

            await getPromiseCubeData(token, cookie,cubeId, postData)
            .then((resCubeData)=> {

        //  outputSpeech = `My cookie is ok wuola 2. `;
            console.log("Have cube data:");
            console.log(JSON.stringify(resCubeData));

            var metricValue = 0;
                
            var root = resCubeData.result.data.root;
            console.log(root);
            var child = getLastChild(root);
            console.log("last child");
            console.log(JSON.stringify(child));
            var metrics = child.metrics;
            var metricName = Object.keys(metrics)[0];
            var metric = metrics[metricName];
            metricValue = metric.fv;
            console.log('metricValue: ' + metricValue);
            console.log('max: ' + max);
            if (masmenos=="menos"){
                console.log('entro en menos ');
                if (metric.rv < max) {
                    //  console.log(i + ' lowest number' + Numbers[i]);
                    max = metricValue;
                    outputSpeech = 'La planta ' + cubeDefObj.element.name + ', que tiene ' + max + ' de ' + myMetrics ;
                    }
            }else{
                console.log('entro en mas ');
                if (metric.rv > max) {
                    //    console.log(i + ' max number' + Numbers[i]);
                    max = metricValue;
                    outputSpeech = 'La planta ' + cubeDefObj.element.name + ', que tiene ' + max + ' de ' + myMetrics ;
                    }
            }

            
            
            console.log(outputSpeech);

            })
            .catch((err) => {
                console.log(`ERROR en getPromiseCubeData: ${err.message}`);
                // set an optional error message here
                outputSpeech = 'No he comprendido tu pregunta, vuelve a preguntar' ;
            });

            // console.log(JSON.stringify(postData));

        }

        console.log(`por ultimo`);    
         return handlerInput.responseBuilder
        .speak(outputSpeech)
        .reprompt("¿Quieres saber otra información?")
        .getResponse();

    },

};



const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Hola, puedes preguntar hacerme preguntas como ¿cual es el valor de bultos confirmados?, ¿Cual es el valor de bultos confirmados para la planta CDR?';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};
const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speakOutput = 'Hasta luego!';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse();
    }
};

// The intent reflector is used for interaction model testing and debugging.
// It will simply repeat the intent the user said. You can create custom handlers
// for your intents by defining them above, then also adding them to the request
// handler chain below.
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = `Se ejecutó el método ${intentName}`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};

// Generic error handling to capture any syntax or routing errors. If you receive an error
// stating the request handler chain is not found, you have not implemented a handler for
// the intent being invoked or included it in the skill builder below.
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.log(`~~~~ Error handled: ${error.stack}`);
        //const speakOutput = `Sorry, I had trouble doing what you asked. Please try again.`;

        const speakOutput = 'Ha ocurrido un error, detalle:' + error.message;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};


// The SkillBuilder acts as the entry point for your skill, routing all request and response
// payloads to the handlers above. Make sure any new handlers or interceptors you've
// defined are included below. The order matters - they're processed top to bottom.
 exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        // HelloWorldIntentHandler,
        MetricaIntentHandler,
        MetricaPlantaIntentHandler,
        PlantaIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler, // make sure IntentReflectorHandler is last so it doesn't override your custom intent handlers
    )
    .addErrorHandlers(
        ErrorHandler,
    )
    .lambda(); 

    /*********************************************************************************************/
    /*********************************************************************************************/
    /*********************************************************************************************/
    /*********************************************************************************************/
    /*********************************************************************************************/
    /***************************************FUNCIONES DE MSTR*************************************/
    /*********************************************************************************************/
    /*********************************************************************************************/
    /*********************************************************************************************/
    /*********************************************************************************************/
    

const getPromiseRemoteSession = () => new Promise((resolve, reject) => {
    var post_data = '{\"username\": \"'+config.username+'\",\"password\": \"'+config.password+'\"}';
    console.log("post_data: " + post_data);

  // An object of options to indicate where to post to
  var post_options = {
      host: config.webserver,
      port: '443',
      path: '/MicroStrategyLibrary/api/auth/login',
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
      }
  };
  
   var strPostOptions = JSON.stringify(post_options, null, 4); // (Optional) beautiful indented output.
   console.log("post_options: " + strPostOptions); // Logs output to dev tools console.
              
   var responseString = '';
    
  // Set up the request
  var post_req = https.request(post_options, function(res) {
      res.setEncoding('utf8');
      res.on('data', function (chunk) {
          responseString += chunk;
      });
      res.on('end', function () {
          
          console.log("res.statusCode: " + res.statusCode);
          
          if (res.statusCode == 204){
            console.log(res.headers);
            let promiseResolution = {
                cookie : res.headers['set-cookie'],
                token  : res.headers['x-mstr-authtoken']
            };

            resolve(promiseResolution);
        }
        else{
            var str = JSON.stringify(res.headers, null, 4); // (Optional) beautiful indented output.
            console.log("header: " + str); // Logs output to dev tools console.
            
            var error = "The cloud server " + config.cloudEnvNumber + " is running, but there was an error creating a session. Please check your credentials and try again.";
            reject(error);
        }
      });
  });

  // post the data
  post_req.write(post_data);
  post_req.end();
});


const getPromiseCubeDefinition = (token,cookie,cubeID) => new Promise((resolve, reject) => {
    console.log("Get cube definition:");

    var projectID = config.projectID;
    var post_data = '';
    
     // An object of options to indicate where to post to
  var post_options = {
      host:config.webserver,
      port: '443',
      path: '/MicroStrategyLibrary/api/cubes/' + cubeID,
      method: 'GET',
      headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-MSTR-AuthToken':token,
          'X-MSTR-ProjectID':projectID,
          'cookie': cookie[0]
      }
  };
  
  //console.log(post_options);

    var responseString = '';
    
  // Set up the request
  var post_req = https.request(post_options, function(res) {
      res.setEncoding('utf8');
      res.on('data', function (chunk) {
          responseString += chunk;
      });
      res.on('end', function () {
          resolve(JSON.parse(responseString));
      });
  });

  // post the data
  post_req.write(post_data);
  post_req.end();
});


const getPromiseCubeData = (token,cookie,cubeID, postData) => new Promise((resolve, reject) => {
    console.log("Get cube data:");

    console.log(JSON.stringify(postData));


    var projectID = config.projectID;
    
    var path = '/MicroStrategyLibrary/api/cubes/' + cubeID + '/instances?limit=1000';
    console.log("path: " + path);
    
     // An object of options to indicate where to post to
    var post_options = {
        host:config.webserver,
        port: '443',
        path: path,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-MSTR-AuthToken':token,
            'X-MSTR-ProjectID':projectID,
            'cookie': cookie[0]
        }
    };
  
  console.log(post_options);

    var responseString = '';
        
    // Set up the request
    var post_req = https.request(post_options, function(res) {
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            responseString += chunk;
        });
        res.on('end', function () {
            // console.log(responseString);
            var responseObj = JSON.parse(responseString);
            var error = null;
            if(responseObj.message != undefined){
                console.log("ERROR");
                error = responseObj.message;
                reject(error);
            }
            resolve(responseObj);
            //console.log("should get error: " + error);
            //return callback(error, responseObj);
            
        });
    });

    // post the data
    post_req.write(JSON.stringify(postData));
    post_req.end();
});


function formCubePostData(cubeDef, requiredAttributeNames, requiredMetricNames, filters){
    
    var postData = {"requestedObjects":{"attributes":[],"metrics":[]}};
    
    for(var i = 0; i < requiredAttributeNames.length; i++){
        var obj = requiredAttributeNames[i];
        var objID = getIDFromCubeDef(cubeDef, obj, 'attribute');
       // console.log("Obj: " + obj + " ID: " + objID);
        if (objID== null){
            throw obj + " no encontrado"; // genera una excepción
        }
        
        postData.requestedObjects.attributes.push({'id':objID});
    }
    
    for(var i = 0; i < requiredMetricNames.length; i++){
        var obj = requiredMetricNames[i];
        var objID = getIDFromCubeDef(cubeDef, obj, 'metric');
       // console.log("Obj: " + obj + " ID: " + objID);
        if (objID== null){
            throw obj + " no encontrado"; // genera una excepción
        }
        postData.requestedObjects.metrics.push({'id':objID});
    }
    
    //Form filter:

    if (filters.length !=0 ){


    }
    var filter = {"operator":"And","operands":[]};
    
    for(var i = 0; i < filters.length; i++){
        var filterRequest = filters[i];
        console.log("Filtro");
         console.log(filterRequest.name);
         console.log(filterRequest.type);
         var elementID =   '';

         if (filterRequest.id!=''){
            elementID=filterRequest.id;
         }
        if(filterRequest.type == 'attribute'){
            var atrID = getIDFromCubeDef(cubeDef, filterRequest.name, filterRequest.type);
           // var objID = getIDFromCubeDefFilter(cubeDef, filterRequest.name, filterRequest.type);

            console.log("elementID: "+ elementID);
            var component = {"operator":"In","operands":
                                [   {"type":"attribute","id":atrID, "name":filterRequest.name},
                                    {"type":"elements",
                                            "elements":[{"id":elementID, "name": filterRequest.element.toUpperCase()}]
                                    }
                                ]
                            };
            
           //var component = {"operator":"In","operands":[{"type":"attribute","id":objID},{"type":"elements","id":elementID}]};

            filter.operands.push(component);
    
        }
        else{
            console.log("havent built this protoype to support metric filters");
        }

      console.log("filter");
      console.log(JSON.stringify(filter));
      postData.viewFilter = filter;
    }


    return postData;
}
function getIDAttributeFilter(cubeDef, name){
    
    var cubeDefAttributes = cubeDef.result.data.root.children;

       console.log('getIDAttributeFilter; ' + cubeDefAttributes.length) ;

    for(var i = 0; i < cubeDefAttributes.length; i++){
        var cubeDefObj = cubeDefAttributes[i];
        
      //   console.log('cubeDefObj; ' + cubeDefObj.element.name.toUpperCase() );
      //   console.log('Param name; ' + name.toUpperCase()  );
        
        if(cubeDefObj.element.name.toUpperCase() == name.toUpperCase() ){
            // console.log('entro');
            return  cubeDefObj.element.id;
        }
    }
    return null;
}

function getIDFromCubeDef(cubeDef, name, type){
    
    if(type == 'attribute'){
        var cubeDefAttributes = cubeDef.result.definition.availableObjects.attributes;
        console.log('attribute; '  );
        for(var i = 0; i < cubeDefAttributes.length; i++){
            var cubeDefObj = cubeDefAttributes[i];

        //       console.log('cubeDefObjname; ' + cubeDefObj.name);
         //      console.log('cubeDefObjid; ' + cubeDefObj.id  );
            if(cubeDefObj.name.toUpperCase() == name.toUpperCase()){
                return cubeDefObj.id;
            }
        }
    }
    if(type == 'metric'){
        var cubeDefMetrics = cubeDef.result.definition.availableObjects.metrics;
        console.log('metric; '  );
        for(var i = 0; i < cubeDefMetrics.length; i++){
            var cubeDefObj = cubeDefMetrics[i];
        //    console.log('cubeDefObjname; ' + cubeDefObj.name);
        //    console.log('cubeDefObjid; ' + cubeDefObj.id  );
            if(cubeDefObj.name.toUpperCase() == name.toUpperCase()){
                return cubeDefObj.id;
            }
        }
    }
    return null;
}

function getElementNameForDepth(depth, obj){
   
    var child = obj;
    for(var i = 0; i < depth+1; i++){
        child = getNextChild(child);
    }
    
    console.log(JSON.stringify(child));
    var element = child.element.name;
    console.log("element: " + element);

    return element;
}

function getChildForDepth(depth, obj){

    var child = obj;
    for(var i = 0; i < depth+1; i++){
        child = getNextChild(child);
    }
    
    return child;
}

function getNextChild(obj){
    var child = obj.children[0];
    console.log("DEPTH: " + child.depth);
    return obj.children[0];
    }

function getLastChild(obj){
    if(obj.children != undefined){
        //console.log("child");
        return getLastChild(obj.children[0]);
    }
    else{
        return obj;
    }

}
function toTitleCase(str) {
    return str.replace(/\w\S*/g, function(txt){
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function pluralToSingular(string){
    var cadenaADividir = string;
    var cadenafinal = "";
    var espacio = " ";
    var arrayDeCadenas = cadenaADividir.split(espacio)

    for (var i = 0; i < arrayDeCadenas.length; i++) {
    
        var ultimo = arrayDeCadenas[i].charAt(arrayDeCadenas[i].length - 1);
        if (ultimo == "s") {
            cadenafinal += arrayDeCadenas[i].substring(0, arrayDeCadenas[i].length - 1) + " ";
        }
        else {
            cadenafinal += arrayDeCadenas[i] + " ";
        }
    }
    
    console.log('pluralToSingular: ' + cadenafinal.trim());
    return cadenafinal.trim();

}

function singularToPlural(string){
    var cadenaADividir = string;
    var cadenafinal = "";
    var espacio = " ";
    var arrayDeCadenas = cadenaADividir.split(espacio)

    for (var i = 0; i < arrayDeCadenas.length; i++) {
    
        var ultimo = arrayDeCadenas[i].charAt(arrayDeCadenas[i].length - 1);
        if (ultimo != "s") {
            cadenafinal += arrayDeCadenas[i] + "s ";
        }
        else {
            cadenafinal += arrayDeCadenas[i] + " ";
        }
    }
    
    console.log('singularToPlural: ' + cadenafinal.trim());
    return cadenafinal.trim();

}

function cubeConection(string){
        
    var aBuscar = "pasado ultimo último anterior".toLowerCase();
    var cadenaADividir = string;
    var espacio = " ";
    var arrayDeCadenas = cadenaADividir.split(espacio)
    var arrayDeCadenasABuscar = aBuscar.split(espacio)

    var actual = "71A7A5284292A2227A31E9A3B8CC0AF7";
    var anterior = "A5F0403B45FBF15AD9F989926268C159";
    var retVal = actual;
    
    for (var i = 0; i < arrayDeCadenas.length; i++) {

        

        for (var j = 0; j < arrayDeCadenasABuscar.length; j++) {

            //console.log(arrayDeCadenasABuscar[j]);
            //console.log(arrayDeCadenas[i].toLowerCase());

            if (arrayDeCadenas[i].toLowerCase().indexOf(arrayDeCadenasABuscar[j]) != -1) {
                retVal = anterior;
                break;
            }

        }
    }
    
    console.log(retVal);
    return retVal;

}