# Domaine Prestige - VIP Winery Members Club (REST API)
# Level tiers map to the required Bronze / Silver / Gold levels:
#   Cellar    = Bronze  (entry level membership)
#   Reserve   = Silver  (mid tier membership)
#   Grand Cru = Gold    (top tier membership)
#
# Member titles: Sommelier, Patron, Connoisseur
# Event types: Wine Tastings, Harvest Dinners, Vineyard Tours
# Event/Member levels must match - only Cellar+ can attend Cellar events,
# Reserve+ can attend Reserve events, Grand Cru only for Grand Cru events
#
# Author: Michelle Gilmore

import os
from datetime import date, datetime

from dotenv import load_dotenv
from flask import Flask, jsonify, request, g, abort
from flask.json.provider import DefaultJSONProvider

from sql import DBconnection, execute_read_query, execute_update_query

# Database settings come from environment variables (see .env.example).
# Nothing secret is stored in the code.
load_dotenv()


# Send dates as YYYY-MM-DD so they work directly in <input type="date">
class ISODateJSONProvider(DefaultJSONProvider):
    def default(self, o):
        if isinstance(o, (date, datetime)):
            return o.isoformat()
        return super().default(o)


app = Flask(__name__)
app.json = ISODateJSONProvider(app)

LEVELS = {'Cellar': 1, 'Reserve': 2, 'Grand Cru': 3}
TITLES = {'Sommelier', 'Patron', 'Connoisseur'}


# ─── HELPERS ─────────────────────────────────────────────────

# Open one database connection per request and reuse it
def get_db():
    if 'db' not in g:
        g.db = DBconnection(
            os.getenv('DB_HOST'),
            os.getenv('DB_USER'),
            os.getenv('DB_PASSWORD'),
            os.getenv('DB_NAME'),
            int(os.getenv('DB_PORT', 3306))
        )
        if g.db is None:
            abort(503, description='Database unavailable')
    return g.db


# Close the connection when the request is finished
@app.teardown_appcontext
def close_db(exception):
    db = g.pop('db', None)
    if db is not None:
        db.close()


@app.errorhandler(400)
@app.errorhandler(503)
def json_error(e):
    return jsonify({'error': e.description}), e.code


# Pull the required fields out of the JSON body, or return a 400 error
def get_fields(*names):
    data = request.get_json(silent=True) or {}
    missing = [n for n in names if data.get(n) in (None, '')]
    if missing:
        abort(400, description='Missing field(s): ' + ', '.join(missing))
    return [data[n] for n in names]


# Helper to check level eligibility
# Grand Cru >= Reserve >= Cellar
def level_rank(level):
    return LEVELS.get(level, 0)


def check_level(level):
    if level not in LEVELS:
        abort(400, description='Level must be Cellar, Reserve, or Grand Cru')


def write_or_fail(sql, params, success_message):
    if not execute_update_query(get_db(), sql, params):
        return jsonify({'error': 'Database error'}), 500
    return success_message


# ─── MEMBER ROUTES ───────────────────────────────────────────

# GET all members
@app.route('/members', methods=['GET'])
def get_members():
    rows = execute_read_query(get_db(), "SELECT * FROM member")
    return jsonify(rows)


# GET one member by id
@app.route('/members/<int:id>', methods=['GET'])
def get_member(id):
    rows = execute_read_query(get_db(), "SELECT * FROM member WHERE id = %s", (id,))
    if not rows:
        return jsonify({'error': 'Member not found'}), 404
    return jsonify(rows[0])


# POST - create a new member
@app.route('/members', methods=['POST'])
def create_member():
    name, title, details, level, region, email = get_fields(
        'name', 'title', 'details', 'level', 'region', 'email')
    check_level(level)
    if title not in TITLES:
        abort(400, description='Title must be Sommelier, Patron, or Connoisseur')

    sql = ("INSERT INTO member (name, title, details, level, region, email) "
           "VALUES (%s, %s, %s, %s, %s, %s)")
    return write_or_fail(sql, (name, title, details, level, region, email),
                         'New member added successfully!')


# PUT - update a member
@app.route('/members/<int:id>', methods=['PUT'])
def update_member(id):
    name, title, details, level, region, email = get_fields(
        'name', 'title', 'details', 'level', 'region', 'email')
    check_level(level)
    if title not in TITLES:
        abort(400, description='Title must be Sommelier, Patron, or Connoisseur')

    sql = ("UPDATE member SET name=%s, title=%s, details=%s, level=%s, region=%s, email=%s "
           "WHERE id = %s")
    return write_or_fail(sql, (name, title, details, level, region, email, id),
                         'Member updated successfully!')


# DELETE - delete a member
@app.route('/members/<int:id>', methods=['DELETE'])
def delete_member(id):
    return write_or_fail("DELETE FROM member WHERE id = %s", (id,),
                         'Member deleted successfully!')


# ─── EVENT ROUTES ────────────────────────────────────────────

# GET all events
@app.route('/events', methods=['GET'])
def get_events():
    rows = execute_read_query(get_db(), "SELECT * FROM event ORDER BY date")
    return jsonify(rows)


# GET one event by id
@app.route('/events/<int:id>', methods=['GET'])
def get_event(id):
    rows = execute_read_query(get_db(), "SELECT * FROM event WHERE id = %s", (id,))
    if not rows:
        return jsonify({'error': 'Event not found'}), 404
    return jsonify(rows[0])


# POST - create a new event
@app.route('/events', methods=['POST'])
def create_event():
    name, capacity, level, date_, location = get_fields(
        'name', 'capacity', 'level', 'date', 'location')
    check_level(level)

    # Check no two events on the same date
    existing = execute_read_query(get_db(), "SELECT id FROM event WHERE date = %s", (date_,))
    if existing:
        return jsonify({'error': 'An event already exists on this date'}), 400

    sql = "INSERT INTO event (name, capacity, level, date, location) VALUES (%s, %s, %s, %s, %s)"
    return write_or_fail(sql, (name, capacity, level, date_, location),
                         'New event added successfully!')


# PUT - update an event
@app.route('/events/<int:id>', methods=['PUT'])
def update_event(id):
    name, capacity, level, date_, location = get_fields(
        'name', 'capacity', 'level', 'date', 'location')
    check_level(level)

    # Check date conflict with other events (excluding this one)
    existing = execute_read_query(
        get_db(), "SELECT id FROM event WHERE date = %s AND id != %s", (date_, id))
    if existing:
        return jsonify({'error': 'An event already exists on this date'}), 400

    sql = "UPDATE event SET name=%s, capacity=%s, level=%s, date=%s, location=%s WHERE id = %s"
    return write_or_fail(sql, (name, capacity, level, date_, location, id),
                         'Event updated successfully!')


# DELETE - delete an event
@app.route('/events/<int:id>', methods=['DELETE'])
def delete_event(id):
    return write_or_fail("DELETE FROM event WHERE id = %s", (id,),
                         'Event deleted successfully!')


# ─── REGISTRATION ROUTES ─────────────────────────────────────

# GET all registrations
@app.route('/registrations', methods=['GET'])
def get_registrations():
    rows = execute_read_query(get_db(), "SELECT * FROM registration")
    return jsonify(rows)


# GET all registrations for a specific event (user story: see registered members for an event)
@app.route('/registrations/event/<int:event_id>', methods=['GET'])
def get_registrations_by_event(event_id):
    sql = """
        SELECT member.name, member.title, member.level, member.region
        FROM registration
        JOIN member ON registration.member_id = member.id
        WHERE registration.event_id = %s
    """
    rows = execute_read_query(get_db(), sql, (event_id,))
    return jsonify(rows)


# POST - register a member to an event
@app.route('/registrations', methods=['POST'])
def create_registration():
    event_id, member_id = get_fields('event_id', 'member_id')
    db = get_db()

    # Check event exists
    event = execute_read_query(db, "SELECT * FROM event WHERE id = %s", (event_id,))
    if not event:
        return jsonify({'error': 'Event not found'}), 404

    # Check member exists
    member = execute_read_query(db, "SELECT * FROM member WHERE id = %s", (member_id,))
    if not member:
        return jsonify({'error': 'Member not found'}), 404

    # Check level eligibility
    if level_rank(member[0]['level']) < level_rank(event[0]['level']):
        return jsonify({'error': 'Member level too low for this event'}), 403

    # Check capacity
    count = execute_read_query(
        db, "SELECT COUNT(*) AS count FROM registration WHERE event_id = %s", (event_id,))
    if count[0]['count'] >= event[0]['capacity']:
        return jsonify({'error': 'Event is at capacity'}), 400

    # Check duplicate registration
    duplicate = execute_read_query(
        db, "SELECT id FROM registration WHERE event_id = %s AND member_id = %s",
        (event_id, member_id))
    if duplicate:
        return jsonify({'error': 'Member is already registered for this event'}), 400

    # All checks passed - register
    return write_or_fail("INSERT INTO registration (event_id, member_id) VALUES (%s, %s)",
                         (event_id, member_id), 'Member registered successfully!')


# DELETE - remove a registration
@app.route('/registrations/<int:id>', methods=['DELETE'])
def delete_registration(id):
    return write_or_fail("DELETE FROM registration WHERE id = %s", (id,),
                         'Registration removed successfully!')


if __name__ == '__main__':
    # Debug mode is OFF unless you set FLASK_DEBUG=1 in your .env (local use only)
    app.run(port=int(os.getenv('API_PORT', 5000)),
            debug=os.getenv('FLASK_DEBUG') == '1')
