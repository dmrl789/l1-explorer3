import Link from 'next/link';
import { Home, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="max-w-md w-full">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-6xl font-bold text-muted-foreground/30 mb-4">404</div>
          <h2 className="font-semibold text-lg mb-1">Page Not Found</h2>
          <p className="text-sm text-muted-foreground mb-6">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/">
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/tx">
                <Search className="h-4 w-4 mr-2" />
                Browse Explorer
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
