import React, { useRef } from 'react';
import { firestore } from '../utils/firebase';
import Button from '@material-ui/core/Button';
import firebase from 'firebase/app';

export default function Home() {
  const webcamButtonRef = useRef();
  const webcamVideoRef = useRef();
  const callButtonRef = useRef();
  const callInputRef = useRef();
  const answerButtonRef = useRef();
  const remoteVideoRef = useRef();
  const hangupButtonRef = useRef();
  const videoDownloadRef = useRef();

  let videoUrl = null;

  let recordedChunks = [];

  const servers = {
    iceServers: [
      {
        urls: [
          'stun:stun1.l.google.com:19302',
          'stun:stun2.l.google.com:19302',
        ],
      },
    ],
    iceCandidatePoolSize: 10,
  };
  console.log('servers', servers);
  const pc = new RTCPeerConnection(servers);
  let localStream = null;
  let remoteStream = null;
  var options = { mimeType: 'video/webm; codecs=vp9' };
  let mediaRecorder = null;

  const webCamHandler = async () => {
    localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    remoteStream = new MediaStream();

    // Push tracks from local stream to peer connection
    localStream.getTracks().forEach((track) => {
      pc.addTrack(track, localStream);
    });

    // Pull tracks from remote stream, add to video stream
    pc.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remoteStream.addTrack(track);
      });
    };
    webcamVideoRef.current.srcObject = localStream;
    remoteVideoRef.current.srcObject = remoteStream;

    // recording of local video from stream
    mediaRecorder = new MediaRecorder(localStream, options);
    mediaRecorder.ondataavailable = (event) => {
      console.log('data-available');
      if (event.data.size > 0) {
        recordedChunks.push(event.data);
        console.log(recordedChunks);
      }
    };
    mediaRecorder.start();
  };

  const callHandler = async () => {
    console.log('Starting callid generation .... ');
    // Reference Firestore collections for signaling
    const callDoc = firestore.collection('calls').doc();
    const offerCandidates = callDoc.collection('offerCandidates');
    const answerCandidates = callDoc.collection('answerCandidates');

    callInputRef.current.value = callDoc.id;

    // Get candidates for caller, save to db
    pc.onicecandidate = (event) => {
      event.candidate && offerCandidates.add(event.candidate.toJSON());
    };

    // Create offer
    const offerDescription = await pc.createOffer();
    await pc.setLocalDescription(offerDescription);

    const offer = {
      sdp: offerDescription.sdp,
      type: offerDescription.type,
    };

    await callDoc.set({ offer });

    // Listen for remote answer
    callDoc.onSnapshot((snapshot) => {
      const data = snapshot.data();
      if (!pc.currentRemoteDescription && data?.answer) {
        const answerDescription = new RTCSessionDescription(data.answer);
        pc.setRemoteDescription(answerDescription);
      }
    });

    // When answered, add candidate to peer connection
    answerCandidates.onSnapshot((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const candidate = new RTCIceCandidate(change.doc.data());
          pc.addIceCandidate(candidate);
        }
      });
    });

    // hangupButtonRef.current.disabled = false;
  };

  const answerHandler = async () => {
    console.log('Joining the call ....');
    const callId = callInputRef.current.value;
    const callDoc = firestore.collection('calls').doc(callId);
    const answerCandidates = callDoc.collection('answerCandidates');
    const offerCandidates = callDoc.collection('offerCandidates');

    pc.onicecandidate = (event) => {
      event.candidate && answerCandidates.add(event.candidate.toJSON());
    };
    console.log('pc', pc);

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
        console.log(change);
        if (change.type === "added") {
          let data = change.doc.data();
          pc.addIceCandidate(new RTCIceCandidate(data));
        }
      });
    });

  };
  return (
    <div>
      <h1 id="subtitle">
        <span> Start Webcam</span>
      </h1>
      <div className="videos">
        <span>
          <h1 id="subtitle">
            <span> Local Stream</span>
          </h1>
          <video
            className="webcamVideo"
            ref={webcamVideoRef}
            autoPlay
            playsInline
          ></video>
        </span>
        <span>
          <h1 id="subtitle">
            <span> Remote Stream</span>
          </h1>
          <video
            className="webcamVideo"
            ref={remoteVideoRef}
            autoPlay
            playsInline
          ></video>
        </span>
      </div>

      <Button
        color="primary"
        variant="contained"
        onClick={webCamHandler}
        ref={webcamButtonRef}
      >
        Start webcam
      </Button>
      <h1 id="subtitle">
        <span> Create a new Call</span>
      </h1>
      <Button
        color="primary"
        variant="contained"
        onClick={callHandler}
        ref={callButtonRef}
      >
        Create Call (offer)
      </Button>

      <h1 id="subtitle">
        <span> Join a call</span>
      </h1>
      <p>Answer the call from a different browser window or device</p>

      <input ref={callInputRef} />
      <Button
        color="primary"
        variant="contained"
        onClick={answerHandler}
        ref={answerButtonRef}
      >
        Answer
      </Button>

      {/* <h1 id="subtitle">
        <span> Hangup</span>
      </h1>

      <Button
        color="primary"
        variant="contained"
        onClick={hangupHandler}
        ref={hangupButtonRef}
      >
        Hangup
      </Button> */}
      {/* <a ref={videoDownloadRef} href={videoUrl}>
        Download session video
      </a> */}
    </div>
  );
}
