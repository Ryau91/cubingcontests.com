'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { IEvent } from '@sh/types';
import { eventCategories } from '~/helpers/eventCategories';
import EventIcon from '@c/EventIcon';

const EventButtons = ({
  eventId,
  events,
  forPage,
}: {
  eventId: string;
  events: IEvent[];
  forPage: 'results' | 'rankings' | 'competitions' | 'data-entry';
}) => {
  const router = useRouter();
  const { id, singleOrAvg } = useParams();
  const searchParams = useSearchParams();

  const [selectedCat, setSelectedCat] = useState(
    eventCategories.find((el) => events.find((e) => e.eventId === eventId)?.groups.includes(el.group)) ??
      eventCategories[0],
  );

  // If hideCategories = true, just show all events that were passed in
  const filteredEvents = useMemo(
    () =>
      !['rankings', 'competitions'].includes(forPage)
        ? events
        : events.filter((el) => el.groups.includes(selectedCat.group)),
    [events, selectedCat],
  );

  const handleEventClick = (newEventId: string) => {
    if (forPage === 'results') {
      router.push(`/competitions/${id}/results?eventId=${newEventId}`);
    } else if (forPage === 'rankings') {
      const show = searchParams.get('show');
      router.push(`/rankings/${newEventId}/${singleOrAvg}${show ? `?show=${show}` : ''}`);
    } else if (forPage === 'competitions') {
      if (searchParams.get('eventId') === newEventId) window.location.href = '/competitions';
      else router.push(`/competitions?eventId=${newEventId}`);
    } else {
      window.location.href = `/mod/competition/${id}?eventId=${newEventId}`;
    }
  };

  return (
    <div>
      {/* Event categories */}
      {['rankings', 'competitions'].includes(forPage) && (
        <>
          <div className="btn-group btn-group-sm mt-2 mb-3" role="group">
            {eventCategories.map((cat) => (
              <button
                key={cat.value}
                type="button"
                className={'btn btn-primary' + (cat === selectedCat ? ' active' : '')}
                onClick={() => setSelectedCat(cat)}
              >
                <span className="d-none d-md-inline">{cat.title}</span>
                <span className="d-inline d-md-none">{cat.shortTitle || cat.title}</span>
              </button>
            ))}
          </div>

          {selectedCat?.description && <p>{selectedCat.description}</p>}
        </>
      )}

      <div className="d-flex flex-wrap mb-3 fs-3">
        {filteredEvents.map((event) => (
          <EventIcon
            key={event.eventId}
            event={event}
            onClick={() => handleEventClick(event.eventId)}
            isActive={event.eventId === eventId}
          />
        ))}
      </div>
    </div>
  );
};

export default EventButtons;
