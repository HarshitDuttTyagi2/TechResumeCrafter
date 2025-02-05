import { useEffect, useRef, useState } from "react";
import "./newPrompt.css";
import Upload from "../upload/Upload";
import { IKImage } from "imagekitio-react";
import Markdown from "react-markdown";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from '@clerk/clerk-react';
import { ScaleLoader, ClipLoader, SyncLoader } from "react-spinners";

const NewPrompt = ({ data }) => {
  const { getToken } = useAuth();
  const history = useRef(
    data?.history?.map(({ role, parts }) => ({
      role,
      content: parts[0]?.text || "",
    })) || []
  );

  const [question, setQuestion] = useState(""); 
  const [answer, setAnswer] = useState("");
  const [isFetchingResponse, setIsFetchingResponse] = useState(false);
  const [img, setImg] = useState({
    isLoading: false,
    error: "",
    dbData: {},
    aiData: {},
  });

  const endRef = useRef(null);
  const formRef = useRef(null);
  const textRef = useRef(null);

  const queryClient = useQueryClient();

  useEffect(() => {
    if (textRef.current) {
      textRef.current.style.height = "auto";
      textRef.current.style.height = `${textRef.current.scrollHeight}px`;
    }
  }, [answer]);

  const mutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      return fetch(`${import.meta.env.VITE_API_URL}/api/chats/${data._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": 'Bearer ' + token
        },
        body: JSON.stringify({
          question: question.length ? question : undefined,
          answer: answer.length ? answer : undefined,
          img: img.dbData?.filePath || undefined,
        }),
      }).then((res) => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat", data._id] }).then(() => {
        formRef.current.reset();
        setQuestion(""); 
        setAnswer("");
        setImg({
          isLoading: false,
          error: "",
          dbData: {},
          aiData: {},
        });
      });
    },
    onError: (err) => {
      console.log(err);
    },
  });

  const add = async (text, isInitial) => {
    if (!isInitial) {
      setQuestion(text);
      history.current.push({ role: "user", content: text });
    }

    setIsFetchingResponse(true); // Start loader before API request

    try {
      const token = await getToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/ai/openai`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": 'Bearer ' + token
        },
        body: JSON.stringify({
          messages: [...history.current].slice(-6),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch response from OpenAI");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let streamingAnswer = "";

      let done = false;
      let firstChunkReceived = false;

      while (!done) {
        const { value, done: chunkDone } = await reader.read();
        done = chunkDone;

        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          
          if (!firstChunkReceived) {
            setIsFetchingResponse(false); // Hide loader as soon as first chunk is received
            firstChunkReceived = true;
          }

          streamingAnswer += chunk;
          setAnswer((prev) => prev + chunk);
        }
      }

      history.current.push({ role: "assistant", content: streamingAnswer });

      setTimeout(() => {
        mutation.mutate();
      }, 500);
    } catch (err) {
      console.error("Error in addMessage:", err);
      setIsFetchingResponse(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const text = e.target.text.value;
    if (!text) return;

    e.target.text.value = ""; 
    add(text, false);
  };

  const hasRun = useRef(false);

  useEffect(() => {
    if (!hasRun.current) {
      if (data?.history?.length === 1) {
        add(data.history[0].parts[0].text, true);
      }
    }
    hasRun.current = true;
  }, []);

  useEffect(() => {
    if (textRef.current) {
      textRef.current.style.height = "auto";
      textRef.current.style.height = `${textRef.current.scrollHeight}px`;
    }
  }, [question]);

  return (
    <>
      {question && <div className="message user">{question}</div>}

      {/* 🔥 Loader is now positioned BELOW the user's question, before AI response */}
      {isFetchingResponse && (
        <div className="loader-container">
          
    <span className="thinking-text">Thinking</span>
    <ClipLoader size={15} color={"black"} />
        </div>
      )}

      {answer && (
        <div className="message">
          <Markdown>{answer}</Markdown>
        </div>
      )}

      <div className="endChat" ref={endRef}></div>

      <form className="newForm" onSubmit={handleSubmit} ref={formRef}>
        <Upload setImg={setImg} />
        <input id="file" type="file" multiple={false} hidden />
        <textarea
          name="text"
          placeholder="Ask anything..."
          ref={textRef}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              formRef.current.requestSubmit();
            }
          }}
          onInput={(e) => {
            e.target.style.height = "auto";
            e.target.style.height = `${e.target.scrollHeight}px`;
          }}
        ></textarea>
        <button>
          <img src="/arrow.png" alt="Send" />
        </button>
      </form>
    </>
  );
};

export default NewPrompt;
