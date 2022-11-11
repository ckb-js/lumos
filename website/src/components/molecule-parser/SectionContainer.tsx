import React, { ReactNode } from "react"

export const SectionContainer: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <div style={{ marginLeft: "20%", marginRight: "20%", width: "60%" }}>
      { children }
    </div>
  )
}
