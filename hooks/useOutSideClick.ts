import { RefObject, useEffect } from "react";

export const useOutSideClick = (
  ref: RefObject<HTMLDivElement>,
  close: () => void
) => {
  const handleClickOutside = (event: any) => {
    if (ref.current && !ref.current.contains(event.target)) {
      close();
    }
  };

  useEffect(() => {
    document.addEventListener("click", handleClickOutside, true);
    return () => {
      document.removeEventListener("click", handleClickOutside, true);
    };
  }, []);
};
