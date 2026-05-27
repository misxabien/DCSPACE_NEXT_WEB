import type { Metadata } from 'next';
import Image from 'next/image';
import '@/styles/pages/not-found.css';

export const metadata: Metadata = {
  title: 'Page not found - DC Space',
  description: 'This page could not be found.',
};

export default function NotFound() {
  return (
    <section className="not-found" aria-labelledby="not-found-heading">
      <div className="not-found__inner">
        <Image
          className="not-found__image"
          src="/assets/404 not found.svg"
          width={540}
          height={360}
          alt=""
          priority
        />
        <h1 id="not-found-heading" className="not-found__message">
          Oops! The page you&apos;re looking for could not be found.
        </h1>
      </div>
    </section>
  );
}
