import axios from "axios";
import { createContext, useEffect, useState } from "react";

export const StoreContext = createContext(null);

const StoreContextProvider = (props) => {
  const [token, setToken] = useState("");
  const [admin, setAdmin] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [userName, setUserName] = useState("");


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
  };
  return (
    <StoreContext.Provider value={contextValue}>
      {props.children}
    </StoreContext.Provider>
  );
};
export default StoreContextProvider;
