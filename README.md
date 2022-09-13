### Real-Time Communication Web Application

##  Introduction
 WebRTC (Web Real-Time Communications) refers to an open source project that enables real-time voice, text, and video communications capabilities between web browsers and devices.

##  Demo 
What we will be creating can be viewed in this [Demo](https://cdn.dribbble.com/users/702789/screenshots/15054318/media/4ea5d492b7b07eebc9528ff960794879.png?compress=1&resize=1200x900)


You can get the full source code on my [Github](https://github.com/apeli23/nextjswebrtc.git) repo.

##  Prerequisites

This article will require a user to have entry-level knowledge and understanding of javascript and React/Nextjs.

##  Project setup

In your respective directory, generate a Next.js project by using the following command in your terminal
`npx create-next-app nextjswebrtc`

Go to your project directory  using: `cd nextjswebrtc`

## Project dependencies: 
install Cloudinary for nextjs server-side media file upload and firebase to handle our app's database in real-time.

`npm install firebase Cloudinary

We will begin by setting up our backend with the Cloudinary feature.

### Cloudinary Setup
We will require a [Cloudinary](https://cloudinary.com/?ap=em) for nextjs serverside media file upload. Create an account using this [link](https://cloudinary.com/console). 
Check the dashboard for your environment variables ( `Cloud name`, `API Key`, and `API Secret`).  

In your project root directory, create a new file named `.env.local`. Paste the following and fill in the blanks with the respective environment variable from the dashboard.

```
CLOUDINARY_CLOUD_NAME =

CLOUDINARY_API_KEY = 

CLOUDINARY_API_SECRET=
```
Use the following command to run your project: `npm run dev`.

Head to the `pages/api` folder and create a new file named `cloudinary.js`.

In the file configure the environment keys and libraries to avoid code duplication.

```
var cloudinary = require("cloudinary").v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
```
Our backend's post request will be handled by a handler function as follows:
```
export default async function handler(req, res) {
    if (req.method === "POST") {
        let url = ""
        try {
            let fileStr = req.body.data;
            const uploadedResponse = await cloudinary.uploader.upload_large(
                fileStr,
                {
                    resource_type: "video",
                    chunk_size: 6000000,
                }
            );
        } catch (error) {
            res.status(500).json({ error: "Something wrong" });
        }

        res.status(200).json("backend complete");
    }
}
```
In the above code, when a post function is fired, the variable `fileStr ` assigned the request's body data containing the media file from the front end which is then uploaded to the user's Cloudinary profile. The file's Cloudinary URL  is then captured and assigned to the `url` variable.  we will show the message `upload complete!` in the console.

This concludes our backend's Cloudinary integration.

##  Firebase Integration

From Firebase, we will use Firestore. A recommended choice for WebRTC due to its ability to listen to databases in real time.

Locate the official firebase website using this [link](https://firebase.google.com/) and click the `console` option at the top right of the navbar.

If it's your first time, ensure to sign up and log in before you access the console.

In the console, you will be required to create a new project through the `Add project ` option. Proceed with the guided 4-steps to create your project then click to start a firebase app.
After registering your app, you will be provided with instructions on how to use firebase SDK which will also include your respective firebase environment variables. Now we are ready to integrate Firestore into our app.

In your Next.js app's root directory, head to the `.env.local` file and paste the following:
```
apiKey: " "
authDomain:  " "
projectId:  " "
storageBucket:  " "
messagingSenderId:  " "
appId:  " "
measurementId:  " "
```
Fill in the blanks with details from your firebase account and restart your Next.js project again to load the updated environment variables.

### Client-side configurations

When creating a webrtc in nextjs, server-side rendering will have to be handled with consideration that we will use modules that only work in the browser such as the `window` object.

With this in mind, we begin by editing the `next.config.js` to the following: 
```
module.exports = {
  target: "serverless",
  async rewrites() {
    return [
      // Rewrite everything to `pages/index`
      {
        source: "/:any*",
        destination: "/",
      },
    ];
  },
};
```
The code above is only used to redirect work in the development environment. When in production, you can use a proxy server like NGNIX for the redirects.

We then disable SSR for age content by replacing`_app.js` with the following code:

```
import '../styles/globals.css'

function SafeHydrate({ children }) {
  return (
    <div suppressHydrationWarning>
      {typeof window === 'undefined' ? null : children}
    </div>
  )
}

function MyApp({ Component, pageProps }) {
  return <SafeHydrate><Component {...pageProps} /></SafeHydrate>
}

export default MyApp

```
In the above code, we check if we are on the server by confirming that the `window` object is undefined. We then render a div with the prop `suppressHydrationWarning`, which cleans up the errors from hydration mismatch. We then wrap our page component with `SafeHydrate` component for safer readability. We redeploy our app as a static bundle to be served without a Node.js server. Update your "build" script in `package.json` with the following
 ``` 
 "scripts": {
    "build": "next build && next export",
  },
  ```

then in your terminal run `npm run build`

Use this [Link](https://dev.to/apkoponen/how-to-disable-server-side-rendering-ssr-in-next-js-1563) for a better understanding of the above concept.

### Front End.

In your `pages/index.js`, start by including the necessary imports.
```
import React, { useRef} from "react";
import { firestore } from "../utils/firebase"

```
We then create use the `useRef` hook to create variables that we will reference in our DOM elements

```
  const webcamBtnRef = useRef();
  const webcamVideoRef = useRef();
  const callBtnRef = useRef();
  const callInputRef = useRef();
  const answerBtnRef = useRef();
  const remoteVideoRef = useRef();
  const hangupBtnRef = useRef();
  const videoDownloadRef = useRef();
  ```
Add the below the code 

```
let videoUrl = null;

let chunks = [];
```
`videoUrl` will be used to provide the Cloudinary link of the recorded files.
`recordedChunks` array will be populated by event data that will be registered as event listeners.

Streaming in our video elements will be accomplished through global variables for the peer connections. Our peer connection references STUN servers hosted by the Google-a-STUN server which are effective in creating peer-peer connections in terms of discovering suitable IP address ports. We will also have an ICECandidatePoolsize which is a 16-bit integer value that specifies the size of the prefetched ICE candidate pool. Faster connections are established when ICE candidates are fetched by an ICE agent before a user tries to connect. The ICE gathering begins triggering when the candidate pool size is changed.
Having said this, paste the below the `recordedChunks` variable:

```
const servers = {
    iceServers: [
      {
        urls: [
          "stun:stun1.l.google.com:19302",
          "stun:stun2.l.google.com:19302",
        ],
      },
    ],
    iceCandidatePoolSize: 10,
  };
  // Global State
  const pc = new RTCPeerConnection(servers); 

  let localStream = null;
  let remoteStream = null;
  var options = { mimeType: "video/webm; codecs=vp9" }; 

  let mediaRecorder = null;
  ```

The behaviors of the stream object will be defined by the local and remote stream.

Assign a MIME type for WEBM videos to the `options` variable.
The media recorder variable will provide the functionality to easily record the media.

With the above setup. we proceed to code the `webCamHandler `function

Paste the below the `mediaRecorder` function
```
    const webCamHandler = async () => {
    localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    remoteStream = new MediaStream();

    localStream.getTracks().forEach((track) => {
      pc.addTrack(track, localStream);
    });

    pc.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remoteStream.addTrack(track);
      });
    };

    webcamVideoRef.current.srcObject = localStream;
    remoteVideoRef.current.srcObject = remoteStream;

    mediaRecorder = new MediaRecorder(localStream, options);
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunks.push(event.data);
        // console.log("recored chunks", recordedChunks);
      }
    };
    mediaRecorder.start();
  }
  ```

The `webCamHandler` will be an async function. The function begins by activating the user's the audio and video stream. It then creates a media stream and connects which is received from local to RTCPeerConnection. The media stream will have at least one media track that is individually added to the RTCPeerConnection when transmitting media to the remote peer. Our local peer conn. will then populate the remote peer with the incoming track event. The `webcamvideoRef` and `remoteVideoRef` will then be populated by local and remote video respectively.
The media recorder provides a media recording interface. Here we will register a data event listener that populates the event data to the ` recoredChunks` array before activating the media recorder.

The next function will be the `callHandler` function. Start by pasting the following:
```
const callHandler = async () => {
    const callDoc = firestore.collection("calls").doc();
    const offerCandidates = callDoc.collection("offerCandidates");
    const answerCandidates = callDoc.collection("answerCandidates");

    callInputRef.current.value = callDoc.id;

    pc.onicecandidate = (event) => {
      event.candidate && offerCandidates.add(event.candidate.toJSON());
    };

    const offerDescription = await pc.createOffer();
    await pc.setLocalDescription(offerDescription);

    const offer = {
      sdp: offerDescription.sdp,
      type: offerDescription.type,
    };

    await callDoc.set({ offer });

    callDoc.onSnapshot((snapshot) => {
      const data = snapshot.data();
      if (!pc.currentRemoteDescription && data?.answer) {
        const answerDescription = new RTCSessionDescription(data.answer);
        pc.setRemoteDescription(answerDescription);
      }
    });

    await callDoc.set({ offer });

    callDoc.onSnapshot((snapshot) => {
      const data = snapshot.data();
      if (!pc.currentRemoteDescription && data?.answer) {
        const answerDescription = new RTCSessionDescription(data.answer);
        pc.setRemoteDescription(answerDescription);
      }
    });
     
    answerCandidates.onSnapshot((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const candidate = new RTCIceCandidate(change.doc.data());
          pc.addIceCandidate(candidate);
        }
      });
    });
     hangupBtnRef.current.disabled = false;
  }

```

 This async function will begin by referencing variables to the user's Firestore collections. This is done to obtain relevant information for connection establishment. Each offer candidate is saved to the database concerning all call documents containing a subcollection of the offered candidate. We will use the  ‘offer’ method to create an SDP offer when starting a new webRTC connection to a remote peer. We will listen to a document through the snapshot method. The method will be created using an initial callback provided and will contain the contents of the single document. A call will update the snapshot each time the contents will change. During the call handler function moment, the hangup button will be disabled.

 Paste the below the above function to include the answer handler:
 ```
 const answerHandler = async () => {
    const callId = callInputRef.current.value;
    const callDoc = firestore.collection("calls").doc(callId);
    const answerCandidates = callDoc.collection("answerCandidates");
    const offerCandidates = callDoc.collection("offerCandidates");

    pc.onicecandidate = (event) => {
      event.candidate && answerCandidates.add(event.candidate.toJSON());
    };

    const callData = (await callDoc.get()).data();

    const offerDescription = callData.offer;
    await pc.setRemoteDescription(new RTCSessionDescription(offerDescription));

    const answerDescription = await pc.createAnswer();
    await pc.setLocalDescription(answerDescription);

    const answer = {
      type: answerDescription.type,
      sdp: answerDescription.sdp,
    };
    await callDoc.update({ answer });

    offerCandidates.onSnapshot((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          let data = change.doc.data();
          pc.addIceCandidate(new RTCIceCandidate(data));
        }
      });
    });
  }
  ``` 
In the code above, we will begin by populating the caller id input element with the provided id value. we will then use the respective variables to reference Firestore collections. Now each call will contain an offerCandididate's sub-collection. We will therefore get the candidates to save them to the database. We then assign caller IDs with data from the database and use the onSnapshot method to listen to the document. A snapshot will immediately be created with the current contents of the single document. For every change in content, another call will update the document snapshot.
  
Below the above function paste the handlerFunction codes below:

```
const hangupHandler = () => {

    localStream.getTracks().forEach((track) => track.stop());
    remoteStream.getTracks().forEach((track) => track.stop());
    mediaRecorder.onstop = async (event) => {
      let blob = new Blob(recordedChunks, {
        type: "video/webm",
      });

      await readFile(blob).then((encoded_file) => {
        uploadVideo(encoded_file);
      });

      videoDownloadRef.current.href = URL.createObjectURL(blob);
      videoDownloadRef.current.download =
        new Date().getTime() + "-locastream.webm";
    };
    console.log(videoDownloadRef);

  };
```
Above, we begin by calling the getTrack method to obtain the local stream video element. We will iterate over them and call each track's stop method. We then handle the stop event using the `onstop` event handler from the media recorder. At this point, we can either download or upload the video stream.
We will use the file reader function to encode our blob(recordedChunks) to a 64bit encoded file and then pass the file to the handler function. The file reader and upload function are as follows:
```
function readFile(file) {
    console.log("readFile()=>", file)
    return new Promise(function (resolve, reject) {
      let fr = new FileReader();

      fr.onload = function () {
        resolve(fr.result);
      };

      fr.onerror = function () {
        reject(fr);
      };

      fr.readAsDataURL(file);

    }
    );
  }

  const uploadVideo = async (base64) => {
    try {
      fetch("/api/upload", {
        method: "POST",
        body: JSON.stringify({ data: base64 }),
        headers: { "Content-Type": "application/json" },
      }).then((response) => {
        console.log("successfull session", response.status);
      });
    } catch (error) {
      console.error(error);
    }
  }
```

The encoded file once sent to the `/api/upload` URL will be sent to the backend directory created earlier to be uploaded to Cloudinary.


Then in our index component's return statement, add the following code. The css files can be located in the GitHub repo:
```
return (
    <div id="center">
      <h1>Start Webcam</h1>
      <div className="videos">
        <span>
          <p>Local Stream</p>
          <video
            className="webcamVideo"
            ref={webcamVideoRef}
            autoPlay
            playsInline
          />
        </span>
        <span>
          <p>Remote Stream</p>
          <video
            className="webcamVideo"
            ref={remoteVideoRef}
            autoPlay
            playsInline
          ></video>
        </span>
      </div>
      <Button
        variant="contained"
        color="primary"
        onClick={webCamHandler}
        ref={webcamBtnRef}
      >
        Start Webcam
      </Button>
      <p>Create a new call</p>
      <Button
        variant="contained"
        color="primary"
        onClick={callHandler}
        ref={callBtnRef}
      >
        Create Call(Offer)
      </Button>
      <p>Join a call</p>
      <p>Answer the call from a different browser window or device</p>

      {/* <TextField id="filled-basic" label="id" variant="filled"  ref={callInputRef} /> */}
      <input ref={callInputRef} />
      <Button
        color="primary"
        variant="contained"
        onClick={answerHandler}
        ref={answerBtnRef}
      >
        Answer
      </Button>
      <p>Hangup</p>
      <Button
        color="primary"
        variant="contained"
        onClick={hangupHandler}
        ref={hangupBtnRef}
      >
        Hangup
      </Button>
      <a ref={videoDownloadRef} href={videoUrl}>
        Download session video
      </a>
    </div>
  );
  ```
The pasted code above will result in achieving the UI below:


![UI](https://res.cloudinary.com/dogjmmett/image/upload/v1663076952/Screenshot_2022-09-13_at_16.45.54_fqislv.png 'UI')