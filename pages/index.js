import React, { useRef } from 'react';
import { firestore } from '../utils/firebase';
import firebase from "firebase/app";
import Button from '@material-ui/core/Button';
import Layout from '../components/Layout';

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

  //Global State
  const pc = new RTCPeerConnection(servers); //Returns a newly-created RTCPeerConnection, which represents a connection between the local device and a remote peer
  console.log('pc', pc);
  return (
    <>
      <h1>MAIN</h1>
    </>
  );
}
