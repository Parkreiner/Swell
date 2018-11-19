import * as store from '../store';
import * as actions from '../actions/actions';

const ReqResCtrl = {
  openConnectionArray:[],


  /* Iterates across REQ/RES Array and opens connections for each object and passes each object to fetchController */
  openAllEndPoints(e) {
    const gotState = store.default.getState();
    const reqResArr = gotState.business.reqResArray;
    ReqResCtrl.closeAllEndpoints(e);

    reqResArr.forEach(reqResObj => {
      const reqResId = reqResObj.id;
        ReqResCtrl.setAbortCtrl(reqResId);
    })
  },

  closeEndPoint(e) {
    const gotState = store.default.getState();
    const reqResArr = gotState.business.reqResArray;
    let reqResObj;
    ReqResCtrl.openConnectionArray.forEach((el) => {
      if(el.id == e.target.id){
        console.log('match')
        reqResObj = el
      }
    });
    
    reqResObj.abort.abort();
    const openConnectionObj = {
      abort : new AbortController(),
    }
    ReqResCtrl.openConnectionArray.push(openConnectionObj);
  },

  /* Closes all open endpoint */
  closeAllEndpoints(e) {
      ReqResCtrl.openConnectionArray.forEach( abortObject => {
      abortObject.abort.abort();
      let openConnectionObj = {
        abort : new AbortController(),
      }
      ReqResCtrl.openConnectionArray.push(openConnectionObj);
    })
  },

  clearAllEndPoints(e) {
    const gotState = store.default.getState();
    const reqResArr = gotState.business.reqResArray;
    store.default.dispatch(actions.reqResClear());
    console.log('>', reqResArr);
    ReqResCtrl.closeAllEndpoints(e);
  },

  setAbortCtrl(id) {
    const openConnectionObj = {
      abort : new AbortController(),
      id: id,
    }
    const gotState = store.default.getState();
    const reqResArr = gotState.business.reqResArray;
    // Search the store for the passed in ID
    const reqResObj = reqResArr.find((el) => el.id == openConnectionObj.id);
    ReqResCtrl.openConnectionArray.push(openConnectionObj);
    ReqResCtrl.parseReqObject (reqResObj, openConnectionObj.abort);
  },

  parseReqObject(object, abortController) {
    let { url, request: { method }, request: { headers }, request: { body } } = object;

    method = method.toUpperCase();
    
    let formattedHeaders = {};
    headers.forEach(head => {
      formattedHeaders[head.key] = head.value
    })

    // formattedHeaders["Access-Control-Allow-Origin"] = '*';

    let outputObj = {
      method: method,
      mode: "cors", // no-cors, cors, *same-origin
      cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
      credentials: "same-origin", // include, *same-origin, omit
      headers: formattedHeaders,
      redirect: "follow", // manual, *follow, error
      referrer: "no-referrer", // no-referrer, *client
    };

    if (method !== 'GET' && method !== 'HEAD') {
      outputObj.body = body;
    }

    this.fetchController(outputObj, url, object, abortController)
  },

  /* Utility function to open fetches */
  fetchController(parsedObj, url, originalObj, abortController) {
    let timeSentSnap = Date.now();
<<<<<<< HEAD
=======

    const newObj = JSON.parse(JSON.stringify(originalObj));
    newObj.connection = 'pending';
    store.default.dispatch(actions.reqResUpdate(newObj));

>>>>>>> dev
    const signal = abortController.signal;

    parsedObj.signal = signal; 

    return fetch(url, parsedObj)
    .then(response => {
      let heads = {};

      for (let entry of response.headers.entries()) {
        heads[entry[0].toLowerCase()] = entry[1];
      }

      const contentType = heads['content-type'];
      const isStream = contentType.includes('stream');

      isStream ? this.handleSSE(response, originalObj, timeSentSnap, heads) : this.handleSingleEvent(response.json(), originalObj, timeSentSnap, heads);
    })
    .catch(err => console.log(err))
  },

<<<<<<< HEAD
  handleSingleEvent(response, originalObj, timeSentSnap) {
    const newObj = JSON.parse(JSON.stringify(originalObj));
    
    newObj.connection = 'closed';
    newObj.connectionType = 'plain';
    newObj.timeSent = timeSentSnap;
    newObj.timeReceived = Date.now();
    newObj.response = {
      headers: [response.headers],
      events: [],
    };
=======
  handleSingleEvent(response, originalObj, timeSentSnap, headers) {
    console.log('Handling Single Event')

    const newObj = JSON.parse(JSON.stringify(originalObj));
>>>>>>> dev

    response.then((res) => {
      newObj.connection = 'closed';
      newObj.connectionType = 'plain';
      newObj.timeSent = timeSentSnap;
      newObj.timeReceived = Date.now();
      newObj.response = {
        headers: headers,
        events: [],
      };

      newObj.response.events.push({
        data: res,
        timeReceived: Date.now(),
      });
      store.default.dispatch(actions.reqResUpdate(newObj));
    })
  },

  /* handle SSE Streams */
  handleSSE(response, originalObj, timeSentSnap, headers) {
    let reader = response.body.getReader();

    read();

    const newObj = JSON.parse(JSON.stringify(originalObj));

    newObj.timeSent = timeSentSnap;
    newObj.timeReceived = Date.now();
    newObj.response = {
      headers,
      events: [],
    };

    newObj.connection = 'open';
    newObj.connectionType = 'SSE';

    function read() {
      reader.read().then(obj => {
        if (obj.done) {
          return;
        } 

        //decode and recursively call
        else {
          let receivedEventFields = new TextDecoder("utf-8").decode(obj.value)
          //since the string is multi line, each for a different field, split by line
          .split('\n')
          //remove empty lines
          .filter(field => field != '')
          //massage fields so they can be parsed into JSON
          .map(field => {
            let fieldColonSplit = field
            .replace(/:/,'&&&&')
            .split('&&&&')
            .map(kv => kv.trim());

            let fieldObj = {
              [fieldColonSplit[0]] : fieldColonSplit[1],
            }

            return fieldObj;
          })
          .reduce((acc, cur) => {
            let key = Object.keys(cur)[0];
            if (acc[key]) {
              acc[key] = acc[key] + '\n' + cur[key];
            } else {
              acc[key] = cur[key];
            }
            return acc;
          },{})

          receivedEventFields.timeReceived = Date.now();
          
          newObj.response.events.push(receivedEventFields);

          store.default.dispatch(actions.reqResUpdate(newObj));
          read();
        }
      });
    }
<<<<<<< HEAD
=======
  },

  /* Creates a REQ/RES Obj based on event data and passes the object to fetchController */
  toggleOpenEndPoint(e, abortController) {
    console.log('e', e);
    const reqResComponentID = e.target.id;
    const gotState = store.default.getState();
    const reqResArr = gotState.business.reqResArray;

    // Search the store for the passed in ID
    const reqResObj = reqResArr.find((el) => el.id == reqResComponentID);

    ReqResCtrl.parseReqObject(reqResObj, abortController);
  },

  /* Iterates across REQ/RES Array and opens connections for each object and passes each object to fetchController */
  openAllEndPoints(e) {
    console.log('sup')
    const reqResContainer = document.querySelector('#reqResContainer');

    if (reqResContainer.hasChildNodes()) {
      let children = reqResContainer.childNodes;
    
      for (let i = 0; i < children.length; i++) {
        console.log(children[i])
      }
    }
    // for (let resReqObj of resReqArr) {
    //   fetchController(resReqArr[e.id].endPoint, resReqArr[e.id].method, resReqArr[e.id].serverType);
    // }
  },

  /* Closes all open endpoint */
  closeAllEndpoints(resReqArr, e) {
    for (let resReqObj of resReqArr) {
      closeEndpoint(resReqObj);
    }
>>>>>>> dev
  }
};


export default ReqResCtrl;
