import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-purple-100 mb-6">
        <span className="text-4xl text-purple-700">404</span>
      </div>
      <h1 className="text-3xl font-bold mb-2">Page not found</h1>
      <p className="text-muted-foreground text-center mb-6">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Button asChild className="bg-purple-700 hover:bg-purple-800">
        <Link href="/">Go back home</Link>
      </Button>
    </div>
  )
}
