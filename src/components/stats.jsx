const StatsLayout = ({ totalCount, files, children }) => {
    return (
      <div className="grid grid-cols-2 items-center text-sm h-6"> {/* Grid layout with fixed height */}
        <div className="justify-self-start">
          {children}
        </div>
        {totalCount > 0 && (
          <div className="justify-self-end text-stone-400">
            Found {totalCount.toLocaleString()} files. Showing {files.length.toLocaleString()} so far.
          </div>
        )}
      </div>
    );
  };
  
  export default StatsLayout;