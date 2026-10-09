const MainNavbar = () => {
  return (
    <div className="navbar bg-base-100 shadow-sm p-0">
      <div className="navbar-start"></div>
      <div className="navbar-center hidden lg:flex"></div>
      <div className="navbar-end">
        <div className="flex flex-row gap-2 p-2">
          <button className="btn">Daftar</button>
          <button className="btn btn-primary">Masuk</button>
        </div>
      </div>
    </div>
  );
};

export default MainNavbar;
