import { UserCircle } from 'lucide-react';

export function AppBar() {
  return (
    <div className="bg-[#111827] flex h-16 items-center justify-between px-1 py-2 w-full relative">
      {/* Leading icon */}
      <div className="flex items-center justify-center w-12 h-12">
        <div className="flex items-center justify-center rounded-full w-10 h-10 overflow-hidden">
          <div className="flex items-center justify-center w-full h-full">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 18H20V10H13V6H4V18ZM4 20C3.45 20 2.97917 19.8042 2.5875 19.4125C2.19583 19.0208 2 18.55 2 18V6C2 5.45 2.19583 4.97917 2.5875 4.5875C2.97917 4.19583 3.45 4 4 4H20C20.55 4 21.0208 4.19583 21.4125 4.5875C21.8042 4.97917 22 5.45 22 6V18C22 18.55 21.8042 19.0208 21.4125 19.4125C21.0208 19.8042 20.55 20 20 20H4Z" fill="#9CA3AF"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Center title */}
      <div className="absolute left-14 right-14 top-1/2 -translate-y-1/2 flex flex-col items-center justify-center">
        <p className="text-[#9ca3af] text-[22px] font-normal text-center overflow-hidden text-ellipsis whitespace-nowrap w-full">
          VocalAid
        </p>
      </div>

      {/* Trailing avatar */}
      <div className="flex items-center justify-between w-12 h-12">
        <div className="bg-[#3b82f6] rounded-full w-8 h-8 flex items-center justify-center relative">
          <UserCircle className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
}
