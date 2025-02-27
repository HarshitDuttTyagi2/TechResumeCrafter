import "./chatPage.css";
import NewPrompt from "../../components/newPrompt/NewPrompt";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import Markdown from "react-markdown";
import { IKImage } from "imagekitio-react";
import { useAuth } from '@clerk/clerk-react';
import { ScaleLoader } from "react-spinners";
const ChatPage = () => {
  const path = useLocation().pathname;
  const chatId = path.split("/").pop();
  const {getToken} = useAuth()
  const { isPending, error, data } = useQuery({
    queryKey: ["chat", chatId],
    queryFn: async () =>{
      const token = await getToken();
      return fetch(`${import.meta.env.VITE_API_URL}/api/chats/${chatId}`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization":'Bearer '+token
        },
      }).then((res) => res.json())
    }
  });

  console.log(data);

  return (
    <div className="chatPage">
      <div className="wrapper">
        <div className="chat">
          {isPending
            ? (
              <div className="loader-container">
                <ScaleLoader size={20} color={"black"} loading={isPending} height={35} width={4} />
              </div>
            )
            : error
            ? "Something went wrong!"
            : data?.history?.map((message, i) => (
                <>
                  {message.img && (
                    <IKImage
                      urlEndpoint={import.meta.env.VITE_IMAGE_KIT_ENDPOINT}
                      path={message.img}
                      height="300"
                      width="400"
                      transformation={[{ height: 300, width: 400 }]}
                      loading="lazy"
                      lqip={{ active: true, quality: 20 }}
                    />
                  )}
                  <div
                    className={
                      message.role === "user" ? "message user" : "message"
                    }
                    key={i}
                  >
                    <Markdown>{message.parts[0].text}</Markdown>
                  </div>
                </>
              ))}

          {data && <NewPrompt data={data}/>}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;