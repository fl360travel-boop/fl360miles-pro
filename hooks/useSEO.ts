
import { useEffect } from 'react';

export function useSEO(title: string, description: string) {
    useEffect(() => {
        const prevTitle = document.title;
        const metaDescription = document.querySelector('meta[name="description"]');
        const prevDescription = metaDescription?.getAttribute('content') || '';

        // Update Title
        document.title = `${title} | FL360 Miles`;

        // Update Meta Description
        if (metaDescription) {
            metaDescription.setAttribute('content', description);
        } else {
            const meta = document.createElement('meta');
            meta.name = 'description';
            meta.content = description;
            document.head.appendChild(meta);
        }

        // Cleanup (optional - restores previous title/meta on unmount)
        // commented out because we usually navigate to another page that sets its own SEO
        // return () => {
        //     document.title = prevTitle;
        //     if (metaDescription) {
        //         metaDescription.setAttribute('content', prevDescription);
        //     }
        // };
    }, [title, description]);
}
