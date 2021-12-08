import firebase from 'firebase/app';
import 'firebase/firestore';
import React, { useRef } from 'react';
import { Button } from '@material-ui/core';

const Streamer = (props) => {
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

  return <div>gh</div>;
};
export default Streamer;
