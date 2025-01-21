import { Link } from "react-router-dom";
import "./chatList.css";
import { useQuery } from "@tanstack/react-query";
// console.log("API URL:", import.meta.env.VITE_API_URL);
import { useAuth } from '@clerk/clerk-react';

const ChatList = () => {
  const {getToken} = useAuth()
  const getChats = async () => {
    const token = await getToken();
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/chats`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization":'Bearer '+token
      }
    });
    return res.json();
  }
  const { isPending, error, data } = useQuery({
    queryKey: ["userChats"],
    queryFn: () =>
      getChats(),
  });

  return (
    <div className="chatList">
      <span className="title"><b>DASHBOARD</b></span>
      <Link to="/dashboard">Create a new Chat</Link>
      <Link to="/">Explore Crafter</Link>
      <Link to="/">Contact</Link>
      <hr />
      <span className="title"><b>RECENT CHATS</b></span>
      <div className="list">
        {isPending
          ? "Loading..."
          : error
          ? "Something went wrong!"
          : data?.map((chat) => (
              <Link to={`/dashboard/chats/${chat._id}`} key={chat._id}>
                {chat.title}
              </Link>
            ))}
      </div>
      <hr />
      <div className="upgrade">
        <img src="/logo.png" alt="" />
        <div className="texts">
          <span>Enjoy the superpowers of crafter.</span>
          <span>Complete the work swiftly.</span>
        </div>
      </div>
    </div>
  );
};

export default ChatList;