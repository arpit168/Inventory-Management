const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full py-4 text-center mt-auto">
      <div className="text-xs bg-blue-100 dark:bg-surface py-2 rounded-xl text-gray-700 dark:text-text-muted font-medium">
        Made with <span className="text-danger  animate-pulse inline-block">❤️</span> by Arpit © {currentYear}
      </div>
    </footer>
  );
};

export default Footer;
