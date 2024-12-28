import React, { createContext, useContext, useReducer, useEffect } from "react";
import { QueueItem, Session, QueueState, QueueAction } from "../types";
import { addToQueue, removeFromQueue, getQueue } from "../services/aws";

const initialState: QueueState = {
    session: null,
    queue: [],
    isConnected: false,
};

const QueueContext = createContext<{
    state: QueueState;
    dispatch: React.Dispatch<QueueAction>;
} | null>(null);

const queueReducer = (state: QueueState, action: QueueAction): QueueState => {
    switch (action.type) {
        case "SET_SESSION":
            return { ...state, session: action.payload };

        case "SET_QUEUE":
            return { ...state, queue: action.payload };

        case "ADD_TO_QUEUE":
            return { ...state, queue: [...state.queue, action.payload] };

        case "REMOVE_FROM_QUEUE":
            return {
                ...state,
                queue: state.queue.filter((item) => item.id !== action.payload),
            };

        case "UPDATE_CURRENT_SONG":
            return {
                ...state,
                session: state.session
                    ? { ...state.session, currentSong: action.payload }
                    : null,
                // Remove the song from queue when it becomes current
                queue: state.queue.filter(
                    (item) => item.id !== action.payload.id
                ),
            };

        case "SET_CONNECTION_STATUS":
            return { ...state, isConnected: action.payload };

        default:
            return state;
    }
};

export const QueueProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [state, dispatch] = useReducer(queueReducer, initialState);

    // Load initial queue when session is set
    useEffect(() => {
        const loadQueue = async () => {
            if (state.session?.id) {
                try {
                    const queueData = await getQueue(state.session.id);
                    if (queueData) {
                        dispatch({ type: "SET_QUEUE", payload: queueData });
                    }
                } catch (error) {
                    console.error("Error loading queue:", error);
                }
            }
        };

        loadQueue();
    }, [state.session?.id]);

    // Handle queue updates
    useEffect(() => {
        const handleQueueUpdate = async (action: QueueAction) => {
            if (!state.session?.id) return;

            try {
                switch (action.type) {
                    case "ADD_TO_QUEUE":
                        await addToQueue(state.session.id, action.payload);
                        break;
                    case "REMOVE_FROM_QUEUE":
                        await removeFromQueue(state.session.id, action.payload);
                        break;
                    default:
                        break;
                }
            } catch (error) {
                console.error("Error updating queue:", error);
            }
        };

        return () => {
            // Cleanup if needed
        };
    }, [state.session?.id]);

    return (
        <QueueContext.Provider value={{ state, dispatch }}>
            {children}
        </QueueContext.Provider>
    );
};

export const useQueue = () => {
    const context = useContext(QueueContext);
    if (!context) {
        throw new Error("useQueue must be used within a QueueProvider");
    }
    return context;
};
