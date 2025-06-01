import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Event } from "@shared/schema";

interface UpcomingEventsProps {
  events: Event[];
}

export default function UpcomingEvents({ events }: UpcomingEventsProps) {
  const formatDate = (date: Date | string) => {
    return format(new Date(date), "MMMM d, yyyy, h:mm a");
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Upcoming Events</h2>
      
      {events.length > 0 ? (
        events.map(event => (
          <Card key={event.id} className="bg-gray-800 border-gray-700 mb-4">
            <CardContent className="p-4">
              <h3 className="text-xl font-bold">{event.name}</h3>
              <p className="mb-2"><strong>Date:</strong> {formatDate(event.startDate)}</p>
              {event.location && <p className="mb-2"><strong>Location:</strong> {event.location}</p>}
              <p>{event.description || "No description available."}</p>
            </CardContent>
          </Card>
        ))
      ) : (
        <p className="text-gray-400">No upcoming events.</p>
      )}
    </div>
  );
}
