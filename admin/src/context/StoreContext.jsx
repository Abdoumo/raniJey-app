import axios from "axios";
import { createContext, useEffect, useState } from "react";

export const StoreContext = createContext(null);

const StoreContextProvider = (props) => {
  const [token, setToken] = useState("");
  const [admin, setAdmin] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [userName, setUserName] = useState("");
  const [userId, setUserId] = useState("");
  const [isLoading, setIsLoading] = useState(true);


  useEffect(() => {
    async function loadData() {
      if (localStorage.getItem("token")) {
        setToken(localStorage.getItem("token"));
      }
      if (localStorage.getItem("admin")) {
        setAdmin(JSON.parse(localStorage.getItem("admin")));
      }
      if (localStorage.getItem("userRole")) {
        setUserRole(localStorage.getItem("userRole"));
      }
      if (localStorage.getItem("userName")) {
        setUserName(localStorage.getItem("userName"));
      }
      if (localStorage.getItem("userId")) {
        setUserId(localStorage.getItem("userId"));
      }
      setIsLoading(false);
    }
    loadData();
  }, []);

  const contextValue = {
    token,
    setToken,
    admin,
    setAdmin,
    userRole,
    setUserRole,
    userName,
    setUserName,
    userId,
    setUserId,
    isLoading,
  };
  return (
    <StoreContext.Provider value={contextValue}>
      {props.children}
    </StoreContext.Provider>
  );
};
export default StoreContextProvider;
