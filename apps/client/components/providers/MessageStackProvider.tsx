import React from "react"

type MessageStackProvider = {

}

export const MessageStackProvider = ({children}: React.PropsWithChildren<MessageStackProvider>) => {
  return (
    <div>{children}</div>
  )
}
