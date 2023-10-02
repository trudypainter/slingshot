import React, { useState, useEffect, useRef } from "react";
import { SafeAreaView, View, StyleSheet } from "react-native";
import { Text } from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
  TapGestureHandler,
  State,
} from "react-native-gesture-handler";
import Svg, { Line, Rect } from "react-native-svg";
import { Image } from "react-native";
import { Camera, CameraType } from "expo-camera";
import ViewShot from "react-native-view-shot";

export default function App() {
  const [tGestureStart, setTGestureStart] = useState("");
  const [tGestureMove, setTGestureMove] = useState("");
  const [tGestureUpdate, setTGestureUpdate] = useState("");
  const [tGestureEnd, setTGestureEnd] = useState("");

  const [rects, setRects] = useState([]);
  const [capturedImage, setCapturedImage] = useState(null); // New state variable

  const [cameraPosition, setCameraPosition] = useState(null);
  const cameraRef = useRef(null); // Ref for the Camera component

  const [type, setType] = useState(CameraType.back);
  const [permission, requestPermission] = Camera.useCameraPermissions();

  const safeAreaViewRef = useRef(null);

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission]);

  const onDoubleTap = (event) => {
    if (event.nativeEvent.state === State.ACTIVE) {
      console.log("double tap detected");
      // remove most recent rect
      const newRects = rects.slice(0, rects.length - 1);
      setRects(newRects);
    }
  };

  const pan = Gesture.Pan()
    .onStart((g) => {
      setTGestureStart(`${Math.round(g.x)}, ${Math.round(g.y)}`);
    })
    .onTouchesMove((g) => {
      setTGestureMove(
        `${Math.round(g.changedTouches[0].x)}, ${Math.round(
          g.changedTouches[0].y
        )}`
      );
    })
    .onUpdate((g) => {
      requestAnimationFrame(() => {
        setTGestureUpdate(`${Math.round(g.x)}, ${Math.round(g.y)}`);

        let startX = parseFloat(tGestureStart.split(",")[0]);
        let startY = parseFloat(tGestureStart.split(",")[1]);
        let endX = Math.round(g.x);
        let endY = Math.round(g.y);

        // handle the case where the user drags from right to left
        if (endX < startX) {
          endX = startX;
          startX = Math.round(g.x);
        }

        // handle the case where the user drags from bottom to top
        if (endY < startY) {
          endY = startY;
          startY = Math.round(g.y);
        }

        const width = endX - startX;
        const height = endY - startY;

        const cameraSize = { width, height };
        const cameraPos = {
          x: startX,
          y: startY,
          ...cameraSize,
        };
        setCameraPosition(cameraPos);
      });
    })
    .onEnd((g) => {
      setTGestureStart(null);
      setTGestureEnd(`${Math.round(g.x)}, ${Math.round(g.y)}`);

      let startX = parseFloat(tGestureStart.split(",")[0]);
      let startY = parseFloat(tGestureStart.split(",")[1]);
      let endX = Math.round(g.x);
      let endY = Math.round(g.y);

      // handle the case where the user drags from right to left
      if (endX < startX) {
        endX = startX;
        startX = Math.round(g.x);
      }

      // handle the case where the user drags from bottom to top
      if (endY < startY) {
        endY = startY;
        startY = Math.round(g.y);
      }

      const width = endX - startX;
      const height = endY - startY;

      // Capture the image from the camera
      cameraRef.current
        .takePictureAsync()
        .then((photo) => {
          console.log("startX", startX, "startY", startY);
          // Add the captured image to the list of rects
          setRects([...rects, { x: startX, y: startY, width, height, photo }]);
        })
        .catch((error) => {
          console.log("Error capturing image:", error);
          setCameraPosition(null);
        });

      setCameraPosition(null);
    });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <TapGestureHandler onHandlerStateChange={onDoubleTap} numberOfTaps={2}>
        <View style={{ flex: 1 }}>
          <GestureDetector gesture={pan}>
            <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
              <View style={StyleSheet.absoluteFill}>
                {rects.map((rect, index) => (
                  <Image
                    source={{ uri: rect.photo.uri }}
                    style={{
                      position: "absolute",
                      left: rect.x,
                      top: rect.y,
                      width: rect.width,
                      height: rect.height,
                      backgroundColor: "black",
                    }}
                  />
                ))}
                {cameraPosition && (
                  <Camera
                    ref={cameraRef} // Add the ref to the Camera component
                    style={{
                      position: "absolute",
                      left: cameraPosition.x,
                      top: cameraPosition.y,
                      width: cameraPosition.width,
                      height: cameraPosition.height,
                      borderColor: "black",
                      borderWidth: 2,
                      borderStyle: "solid",
                    }}
                    type={type}
                  />
                )}
              </View>
              <Text
                style={{
                  color: "white",
                  fontSize: 24,
                  fontWeight: "bold",
                  position: "absolute",
                  left: 12,
                  top: 50,
                  padding: 10,
                  paddingLeft: 14,
                  paddingRight: 14,
                  backgroundColor: "blue",
                }}
              >
                SLINGSHOT
              </Text>
              {/* 
          ****** FOR DEBUGGING ****
          <Text
            style={{ color: "white", fontSize: 24 }}
          >{`Gesture started at:  ${tGestureStart}`}</Text>
          <Text
            style={{ color: "white", fontSize: 24 }}
          >{`Gesture moved to:  ${tGestureMove}`}</Text>
          <Text
            style={{ color: "yellow", fontSize: 24 }}
          >{`Gesture updated to:  ${tGestureUpdate}`}</Text>
          <Text
            style={{ color: "white", fontSize: 24 }}
          >{`Gesture ended at:  ${tGestureEnd}`}</Text> */}
            </SafeAreaView>
          </GestureDetector>
        </View>
      </TapGestureHandler>
    </GestureHandlerRootView>
  );
}
