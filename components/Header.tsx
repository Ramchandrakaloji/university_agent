
import React from 'react';

const Header: React.FC = () => {
  return (
    <div className="flex items-center border-b-2 border-gray-200 py-4 px-2">
      <div className="flex items-center justify-center h-10 w-10 rounded-full bg-indigo-500 text-white font-bold">
        G
      </div>
      <div className="flex flex-col ml-3">
        <div className="font-semibold text-lg">Goa University Bot</div>
        <div className="text-sm text-gray-500">Active</div>
      </div>
    </div>
  );
};

export default Header;
