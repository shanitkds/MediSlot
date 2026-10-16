import { getSocket, connectSocket, disconnectSocket, isSocketConnected, getSocketUrl } from "./socket";
import { io } from "socket.io-client";

jest.mock("socket.io-client", () => {
  const mockSocket = {
    connected: false,
    connect: jest.fn(function () {
      this.connected = true;
      return this;
    }),
    disconnect: jest.fn(function () {
      this.connected = false;
      return this;
    }),
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
  };
  return {
    io: jest.fn(() => mockSocket),
  };
});

describe("Frontend Socket.IO Client Connection", () => {
  beforeEach(() => {
    disconnectSocket();
    jest.clearAllMocks();
  });

  it("computes socket URL correctly", () => {
    const url = getSocketUrl();
    expect(url).toBeDefined();
    expect(typeof url).toBe("string");
  });

  it("reuses singleton socket instance and avoids duplicate connections", () => {
    const s1 = getSocket();
    const s2 = getSocket();

    expect(s1).toBe(s2);
    expect(io).toHaveBeenCalledTimes(1);
  });

  it("connects and disconnects cleanly", () => {
    const socket = connectSocket();
    expect(socket.connect).toHaveBeenCalled();
    expect(isSocketConnected()).toBe(true);

    disconnectSocket();
    expect(socket.disconnect).toHaveBeenCalled();
    expect(isSocketConnected()).toBe(false);
  });
});
