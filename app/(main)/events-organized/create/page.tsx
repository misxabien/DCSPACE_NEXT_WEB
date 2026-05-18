import type { Metadata } from 'next';
import { OrganizeForm } from '@/components/OrganizeForm';
import '@/styles/pages/organize.css';

export const metadata: Metadata = {
  title: 'Create Event | DC Space',
};

export default function CreateOrganizedEventPage() {
  return (
    <>
      <header className="organize-header">
        <div className="organize-header__row">
          <div className="organize-header__titles">
            <h1>
              Create an Event with <span>DC Space</span>
            </h1>
          </div>
        </div>
      </header>
      <div className="organize-divider" role="presentation" />

      <div className="main__grid-wrap">
        <OrganizeForm />
      </div>
    </>
  );
}
