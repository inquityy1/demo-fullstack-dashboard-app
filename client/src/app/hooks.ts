import type { TypedUseSelectorHook } from "react-redux";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "./store";
import { useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { addPointToChart } from "../dashboard/metricsSlice";

let socket: Socket;

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export function useSocket() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // 1) Only instantiate once
    if (!socket) {
      socket = io("http://localhost:3000"); // backend origin
    }
    // 2) On receiving a “chart_update” event, dispatch an action
    socket.on(
      "chart_update",
      ({
        id,
        point,
      }: {
        id: number;
        point: { timestamp: number; value: number };
      }) => {
        // Notify Redux that chart with `id` gained a new data point
        dispatch(addPointToChart({ id, point }));
      }
    );

    // 3) Cleanup on unmount
    return () => {
      socket.off("chart_update");
    };
  }, [dispatch]);

  return socket;
}
