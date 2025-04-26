import { User } from "lucide-react";
import { useState } from "react";

function App() {
  const [username, setUsername] = useState<string>("");

  return (
    <div className="w-screen h-screen flex flex-col justify-center items-center">
      <form className="flex flex-col gap-y-2">
        <label className="text-xl text-gray-700 flex gap-x-2 items-center"><User /> Username</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="text-xl max-w-2xl border border-gray-300 rounded-md shadow-sm py-2 px-4"
        />
      </form>
    </div>
  );
}

export default App;
