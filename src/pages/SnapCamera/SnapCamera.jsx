import React, { useCallback, useEffect, useRef, useState } from 'react';
import { bootstrapCameraKit, createMediaStreamSource, Transform2D } from "@snap/camera-kit";
import './SnapCamera.css';
let mediaStream;

const SnapCamera = () => {
  const canvasRef = useRef(null);
  const apiToken = "eyJhbGciOiJIUzI1NiIsImtpZCI6IkNhbnZhc1MyU0hNQUNQcm9kIiwidHlwIjoiSldUIn0.eyJhdWQiOiJjYW52YXMtY2FudmFzYXBpIiwiaXNzIjoiY2FudmFzLXMyc3Rva2VuIiwibmJmIjoxNzE1MDAxMTYyLCJzdWIiOiI2N2YzYmY5OC0yYWQ1LTQ5YmItOGJiNi01MmEyYjNlZTBlNDF-U1RBR0lOR35kOTJiODY0Yy0yMDNmLTQxY2UtOGNkOS1iOTgwZTJiMjliZGEifQ.9_2IWRTvV-1GvtCC_XYjMRgFMtMIo4mM4uigVS7G6oM";
  const lensGroupId = "642ce88b-5e3c-46d0-a7bd-8c08175d062f";
  const cameraSelectRef = useRef(null);
  const lensSelectRef = useRef(null);

  useEffect(() => {
    const init = async () => {
      const cameraKit = await bootstrapCameraKit({ apiToken: apiToken });

      const session = await cameraKit.createSession();

      // Use the ref to get the canvas element
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.replaceWith(session.output.live);
      }
      const { lenses } = await cameraKit?.lenses?.repository?.loadLensGroups([lensGroupId]);
      console.log(lenses);
      session?.applyLens(lenses[0]);
      await setCameraKitSource(session);
      await attachCamerasToSelect(session);
      console.log('attachCamerasToSelect is called');
      await attachLensesToSelect(lenses, session);
      console.log('attachLensesToSelect is called');
    };
    init();
  }, []);

  const setCameraKitSource = async (session, deviceId) => {
    if (mediaStream) {
      session.pause();
      mediaStream.getVideoTracks()[0].stop();
    }

    mediaStream = await navigator.mediaDevices.getUserMedia({ video: { deviceId } });
    const source = createMediaStreamSource(mediaStream);
    await session.setSource(source);
    source.setTransform(Transform2D.MirrorX);
    session.play();
  };

  const attachCamerasToSelect = async (session) => {
    cameraSelectRef.current.innerHTML = '';
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter(({ kind }) => kind === 'videoinput');

    cameras.forEach((camera) => {
      const option = document.createElement('option');
      option.value = camera.deviceId;
      option.text = camera.label;
      cameraSelectRef.current.appendChild(option);
    });

    cameraSelectRef.current.addEventListener('change', (event) => {
      const deviceId = event.target.selectedOptions[0].value;
      setCameraKitSource(session, deviceId);
    });
  };

  const attachLensesToSelect = async (lenses, session) => {
    lensSelectRef.current.innerHTML = '';
    lenses.forEach((lens) => {
      const option = document.createElement('option');
      option.value = lens.id;
      option.text = lens.name;
      lensSelectRef.current.appendChild(option);
    });

    lensSelectRef.current.addEventListener('change', (event) => {
      const lensId = event.target.selectedOptions[0].value;
      const lens = lenses?.find((lens) => lens.id === lensId);
      if (lens) session?.applyLens(lens);
    });
  };
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleAnyMouseEvent = (event) => {
      if (event) {
        setIsVisible(true);
      }
    };

    document.addEventListener('mousemove', handleAnyMouseEvent);
    return () => {
      document.removeEventListener('mousemove', handleAnyMouseEvent);
    };
  }, []);

  useEffect(() => {
    let timeoutId;
    if (isVisible) {
      timeoutId = setTimeout(() => {
        setIsVisible(false);
      }, 3000);
    }
    return () => clearTimeout(timeoutId);
  }, [isVisible]);

  return (
    <div className="container" >
      <canvas ref={canvasRef}/>
      <div style={{display: isVisible ? "flex" : "none", justifyContent:'center'}}>
        <div className="footer"> 
        <select ref={cameraSelectRef}  className="styled-select"></select>
        <select ref={lensSelectRef}  className="styled-select"></select>
        </div>
      </div>
    </div >

  );
};

export default SnapCamera;
