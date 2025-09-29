import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center p-8">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-primary flex items-center justify-center">
          <span className="text-4xl font-bold text-primary-foreground">404</span>
        </div>
        <h1 className="mb-4 text-4xl font-bold text-gradient">Page Not Found</h1>
        <p className="mb-6 text-xl text-muted-foreground max-w-md">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <a 
          href="/" 
          className="inline-flex items-center px-6 py-3 rounded-lg bg-gradient-primary text-primary-foreground font-medium hover:shadow-lg transition-all duration-300 hover:scale-105"
        >
          Return to Dashboard
        </a>
      </div>
    </div>
  );
};

export default NotFound;
