"use client";
import { useWallet } from "@/hooks/useWallet";
import Button from "./ui/Button";

function short(a?: string){ return a ? `${a.slice(0,6)}...${a.slice(-4)}` : "-" }

export default function Header(){
  const { addr, connect } = useWallet();

  return (
    <header className="site-header">
      <div className="container" style={{display:"flex",justifyContent:"space-between",alignItems:"center",height:64}}>
        <div className="nav">
          <a href="/">Dashboard</a>
          <a href="/attendance">Attendance</a>
          <a href="/fragments">Fragments</a>
          <a href="/craft">Craft</a>
          <a href="/expedition">Expedition</a>
          <a href="/upgrade">Upgrade</a>
          <a href="/admin">Admin</a>
        </div>
        <Button variant="primary" onClick={connect}>
          {addr ? short(addr) : "지갑 연결"}
        </Button>
      </div>
    </header>
  );
}