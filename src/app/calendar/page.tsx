'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Calendar } from 'lucide-react';

interface TimeSlot {
  time: string;
  available: boolean;
}

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');

  // Generate time slots (9 AM to 5 PM)
  const timeSlots: TimeSlot[] = [];
  for (let hour = 9; hour < 17; hour++) {
    timeSlots.push({
      time: `${hour}:00`,
      available: true
    });
    timeSlots.push({
      time: `${hour}:30`,
      available: true
    });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback('');

    try {
      const response = await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          time: selectedTime,
          name,
          email,
          phone,
          notes
        })
      });

      const data = await response.json();

      if (response.ok) {
        setFeedback('✅ Booking confirmed! We\'ll send you a confirmation via WhatsApp.');
        // Reset form
        setSelectedDate('');
        setSelectedTime('');
        setName('');
        setEmail('');
        setPhone('');
        setNotes('');
      } else {
        setFeedback(`❌ ${data.error || 'Failed to book appointment'}`);
      }
    } catch (error) {
      setFeedback('❌ Network error. Please try again.');
      console.error('Booking error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center mb-8 text-gray-400 hover:text-white transition-colors">
          ← Back to Home
        </Link>

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-blue-400" />
            <h1 className="text-4xl font-bold mb-4">Schedule a Consultation</h1>
            <p className="text-xl text-gray-300">
              Book a time to discuss how our WhatsApp AI system can transform your sales process
            </p>
          </div>

          <div className="bg-gray-800 rounded-lg shadow-xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Select Date</label>
                  <input
                    type="date"
                    min={today}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Select Time</label>
                  <select
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                    required
                  >
                    <option value="">Choose a time</option>
                    {timeSlots.map((slot) => (
                      <option key={slot.time} value={slot.time}>
                        {slot.time}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Your Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Phone (for WhatsApp confirmation)</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1234567890"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Tell us about your business and what you're looking for..."
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              {feedback && (
                <div className={`p-4 rounded-lg ${feedback.includes('✅') ? 'bg-green-800' : 'bg-red-800'}`}>
                  {feedback}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
              >
                {loading ? (
                  'Booking...'
                ) : (
                  <>
                    <Calendar className="w-5 h-5 mr-2" />
                    Book Consultation
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-8 text-center text-gray-400">
            <p>All times are in your local timezone</p>
            <p className="mt-2">You'll receive a WhatsApp confirmation immediately after booking</p>
          </div>
        </div>
      </div>
    </div>
  );
}