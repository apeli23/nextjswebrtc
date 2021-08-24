import React, { useRef, useEffect } from "react";
import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import { getUsers } from "../utils/user";
import { firestore } from "../utils/firebase"
import firebase from "firebase/app";

export default function Home() {
  useEffect(() => {
    getUsers();
  }, []);

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
          "stun:stun1.l.google.com:19302",
          "stun:stun2.l.google.com:19302",
        ],
      },
    ],
    iceCandidatePoolSize: 10,
  };
  console.log("servers", servers)

  // Global State
  const pc = new RTCPeerConnection(servers);//Returns a newly-created RTCPeerConnection, which represents a connection between the local device and a remote peer
  console.log("pc", pc)

  let localStream = null;
  let remoteStream = null;
  var options = { mimeType: "video/webm; codecs=vp9" };//Multipurpose Internet Mail Extensions  is a standard that indicates the nature and format of a document, file, or assortment of bytes.
  let mediaRecorder = null;

  const webCamHandler = async () => {
    console.log("Starting webcam and mic ..... ");
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

    //populate video element
    webcamVideoRef.current.srcObject = localStream;
    remoteVideoRef.current.srcObject = remoteStream;

    // recording of local video from stream
    mediaRecorder = new MediaRecorder(localStream, options);
    mediaRecorder.ondataavailable = (event) => {
      console.log("data-available");
      if (event.data.size > 0) {
        recordedChunks.push(event.data);
        // console.log("recored chunks", recordedChunks);
      }
    };
    mediaRecorder.start();
  }

  const callHandler = async () => {
    console.log("Starting callid generation .... ");
    // Reference Firestore collections for signaling
    const callDoc = firestore.collection("calls").doc();
    const offerCandidates = callDoc.collection("offerCandidates");
    const answerCandidates = callDoc.collection("answerCandidates");

    callInputRef.current.value = callDoc.id;

    // RTCIceCandidate interface—part of the  WebRTC API—represents a candidate Internet Connectivity Establishment (ICE) configuration which may be used to establish an RTCPeerConnection
    // icecandidate event is sent to an RTCPeerConnection when an RTCIceCandidate has been identified and added to the local peer by a call to RTCPeerConnection.

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

    await callDoc.set({ offer });

    // Listen for remote answer
    callDoc.onSnapshot((snapshot) => {
      const data = snapshot.data();
      if (!pc.currentRemoteDescription && data?.answer) {
        const answerDescription = new RTCSessionDescription(data.answer);
        pc.setRemoteDescription(answerDescription);
      }
    });
    //      When answered, add candidate to peer connection
    answerCandidates.onSnapshot((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const candidate = new RTCIceCandidate(change.doc.data());
          pc.addIceCandidate(candidate);
        }
      });
    });
    // hangupButtonRef.current.disabled = false;
  }

  const answerHandler = async () => {
    console.log("Joining the call ....");
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
        console.log(change);
        if (change.type === "added") {
          let data = change.doc.data();
          pc.addIceCandidate(new RTCIceCandidate(data));
        }
      });
    });
  }

  const hangupHandler =  () => {
    console.log("Hanging up the call ...");

    localStream.getTracks().forEach((track) => track.stop());
    remoteStream.getTracks().forEach((track) => track.stop());
    mediaRecorder.onstop = async (event) => {
      let blob = new Blob(recordedChunks, {
        type: "video/webm",
      });

      await readFile(blob).then((encoded_file) => {
        uploadVideo(encoded_file);
      });

      //FIXME: Send data to cloudinary
      videoDownloadRef.current.href = URL.createObjectURL(blob);
      videoDownloadRef.current.download =
        new Date().getTime() + "-locastream.webm";
    };
    console.log(videoDownloadRef);

  };

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
    console.log(base64)
    try {
      fetch("/api/upload", {
        method: "POST",
        body: JSON.stringify({ data: base64 }),
        headers: { "Content-Type": "application/json" },
        // }).then((response) => {
        //   console.log(response.status);
        //   response.json().then((data) => {
        //     urls.push(data.data);
        //     console.log(urls)
        //   });
      });
    } catch (error) {
      console.error(error);
    }
  }
  return (
    <div className={styles.container}>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <h2>1. Start your Webcam</h2>
      <div className="videos">
        <span>
          <h3>Local Stream</h3>
          <video
            className="webcamVideo"
            ref={webcamVideoRef}
            autoPlay
            playsInline
          ></video>
        </span>
        <span>
          <h3>Remote Stream</h3>
          <video
            className="webcamVideo"
            ref={remoteVideoRef}
            autoPlay
            playsInline
          ></video>
        </span>
      </div>

      <button
        onClick={webCamHandler}
        ref={webcamButtonRef}
      >
        Start webcam
      </button>
      <h2>2. Create a new Call</h2>
      <button
        onClick={callHandler}
        ref={callButtonRef}
      >
        Create Call (offer)
      </button>

      <h2>3. Join a Call</h2>
      <p>Answer the call from a different browser window or device</p>

      <input
        ref={callInputRef}
      />
      <button
        onClick={answerHandler}
        ref={answerButtonRef}
      >
        Answer
      </button>

      <h2>4. Hangup</h2>

      <button
        onClick={hangupHandler}
        ref={hangupButtonRef}
      >
        Hangup
      </button>
      <a
        ref={videoDownloadRef}
        href={videoUrl}
      >
        Download session video
      </a>
    </div>
  )
}
