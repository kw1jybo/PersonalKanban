import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  NOTES_MAX_LENGTH,
  TITLE_MAX_LENGTH,
  WorkItemIdSchema,
  WorkItemStateSchema,
  WorkItemTitleSchema,
  WorkItemNotesSchema,
  WorkItemNumberSchema,
  WorkItemSchema,
  WorkItemIdInputSchema,
  CreateWorkItemInputSchema,
  UpdateWorkItemInputSchema,
  MoveWorkItemInputSchema,
  BoardSchema,
  type WorkItemId,
  type UserId,
  type WorkItem,
  type WorkItemNumber,
} from '../index';
import { expectAcceptedAs, expectRejectedAt, expectRejectedWithout } from '../test-helpers';

////////////////

const validWorkItemBase = {
  id: '1',
  boardNumber: 7,
  title: 'Test Title',
  notes: 'Test Notes',
  state: 'backlog',
  position: 0,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  archivedAt: null,
};

////////////////

describe('Schema reuse', () => {
  it('Ensures state schemas are reused', () => {
    expect(WorkItemSchema.shape.state).toBe(WorkItemStateSchema);
    expect(CreateWorkItemInputSchema.shape.state.unwrap()).toBe(WorkItemStateSchema);
    expect(MoveWorkItemInputSchema.shape.state).toBe(WorkItemStateSchema);
  });

  it('Ensures title schemas are reused', () => {
    expect(WorkItemSchema.shape.title).toBe(WorkItemTitleSchema);
    expect(CreateWorkItemInputSchema.shape.title).toBe(WorkItemTitleSchema);
    expect(UpdateWorkItemInputSchema.shape.title.unwrap()).toBe(WorkItemTitleSchema);
  });

  it('Ensures notes schemas are reused', () => {
    expect(WorkItemSchema.shape.notes).toBe(WorkItemNotesSchema);
    expect(CreateWorkItemInputSchema.shape.notes.unwrap()).toBe(WorkItemNotesSchema);
    expect(UpdateWorkItemInputSchema.shape.notes.unwrap()).toBe(WorkItemNotesSchema);
  });

  it('Ensures ID schemas are reused', () => {
    expect(WorkItemSchema.shape.id).toBe(WorkItemIdSchema);
    expect(WorkItemIdInputSchema.shape.id).toBe(WorkItemIdSchema);
    expect(UpdateWorkItemInputSchema.shape.id).toBe(WorkItemIdSchema);
    expect(MoveWorkItemInputSchema.shape.id).toBe(WorkItemIdSchema);
  });

  it('Ensures WorkItemNumberSchema is reused', () => {
    expect(WorkItemSchema.shape.boardNumber).toBe(WorkItemNumberSchema);
  });
});

////////////////

describe('WorkItemStateSchema', () => {
  it.each(['backlog', 'todo', 'in_progress', 'blocked', 'done'])('accepts %s', (state) => {
    expect(WorkItemStateSchema.safeParse(state).success).toBe(true);
  });

  it('rejects an unknown state', () => {
    expect(WorkItemStateSchema.safeParse('unknown').success).toBe(false);
  });
});

////////////////

describe('WorkItemIdSchema', () => {
  it('should validate a valid work item ID', () => {
    const validId = '1';
    expect(WorkItemIdSchema.parse(validId)).toEqual(validId);
  });

  it('should reject an invalid work item ID', () => {
    expect(WorkItemIdSchema.safeParse(42).success).toBe(false);
    expect(WorkItemIdSchema.safeParse(null).success).toBe(false);
  });

  it('WorkItemId is a distinct type, not a plain string or another id', () => {
    expectTypeOf<string>().not.toExtend<WorkItemId>(); // a plain string is not a WorkItemId
    expectTypeOf<UserId>().not.toExtend<WorkItemId>(); // a UserId is not a WorkItemId
    expectTypeOf<WorkItemId>().toExtend<string>(); // but a WorkItemId is still a string
  });
});

/////////////////

describe('WorkItemNumberSchema', () => {
  it('should validate a valid work item number', () => {
    const validNumber = 1;
    expect(WorkItemNumberSchema.parse(validNumber)).toEqual(validNumber);
  });

  it('WorkItemNumber is a distinct type, not a plain number or a position', () => {
    expectTypeOf<number>().not.toExtend<WorkItemNumber>(); // a number is not a WorkItemNumber
    expectTypeOf<WorkItem['position']>().not.toExtend<WorkItemNumber>(); // a position is not a WorkItemNumber
    expectTypeOf<WorkItemNumber>().toExtend<number>(); // but a WorkItemNumber is still a number
  });

  // failure cases

  it.each([
    ['a string', '41'],
    ['null', null],
    ['number too low', 0],
    ['a non-integer', 1.5],
    ['a negative number', -1],
  ])('should reject %s', (_name, input) => {
    expect(WorkItemNumberSchema.safeParse(input).success).toBe(false);
  });
});

////////////////

describe('WorkItemTitleSchema', () => {
  it.each([
    ['a one-character title', 'a'],
    ['a title at the maximum length', 'a'.repeat(TITLE_MAX_LENGTH)],
    ['a padded title (trimmed)', '  Hi  ', 'Hi'],
    [
      'a max length with extra space',
      'a'.repeat(TITLE_MAX_LENGTH) + ' ',
      'a'.repeat(TITLE_MAX_LENGTH),
    ],
  ])('accepts %s', (_name, title, expected = title) => {
    expect(WorkItemTitleSchema.parse(title)).toEqual(expected);
  });

  // failure cases

  it.each([
    ['an empty title', ''],
    ['a whitespace-only title', '   '],
    ['a title too long', 'a'.repeat(TITLE_MAX_LENGTH + 1)],
  ])('should reject %s', (_name, title) => {
    expect(WorkItemTitleSchema.safeParse(title).success).toBe(false);
  });
});

////////////////

describe('WorkItemNotesSchema', () => {
  it.each([
    ['a one-character note', 'a'],
    ['a note at the maximum length', 'a'.repeat(NOTES_MAX_LENGTH)],
    ['an empty note', ''],
    ['a whitespace-only note', '   '],
  ])('accepts %s', (_name, notes, expected = notes) => {
    expect(WorkItemNotesSchema.parse(notes)).toEqual(expected);
  });

  // failure cases

  it.each([['a note too long', 'a'.repeat(NOTES_MAX_LENGTH + 1)]])(
    'should reject %s',
    (_name, notes) => {
      expect(WorkItemNotesSchema.safeParse(notes).success).toBe(false);
    },
  );
});

////////////////

describe('WorkItemIdInputSchema', () => {
  const validIdInput = { id: '123' };

  it.each([
    ['a valid work item ID', {}],
    ['extra keys are dropped', { extra: true }, {}],
  ])('accepts %s', (_name, override, overrideExpected = override) => {
    expectAcceptedAs(
      WorkItemIdInputSchema,
      { ...validIdInput, ...override },
      { ...validIdInput, ...overrideExpected },
    );
  });

  // failure cases

  it('should reject a missing work item ID', () => {
    expectRejectedWithout(WorkItemIdInputSchema, validIdInput, 'id');
  });

  it('should reject an invalid work item ID', () => {
    expectRejectedAt(WorkItemIdInputSchema, { ...validIdInput, id: '' }, 'id');
  });
});

////////////////

describe('WorkItemSchema', () => {
  it.each([
    ['a nominal item', {}],
    ['archivedAt set', { archivedAt: '2026-02-01T00:00:00.000Z' }],
    ['drops keys that are not in the schema', { admin: true }, {}],
  ])('accepts %s', (_name, override, overrideExpected = override) => {
    expectAcceptedAs(
      WorkItemSchema,
      { ...validWorkItemBase, ...override },
      { ...validWorkItemBase, ...overrideExpected },
    );
  });

  // failure cases

  it.each([
    // work item ID
    ['invalid work item ID', { id: '' }, 'id'],
    // title
    ['title non-valid', { title: '' }, 'title'],
    // notes
    ['notes too long', { notes: 'a'.repeat(NOTES_MAX_LENGTH + 1) }, 'notes'],
    // state
    ['unknown state', { state: 'unknown' }, 'state'],
    // position
    ['position too low', { position: -1 }, 'position'],
    ['position not an integer', { position: 1.5 }, 'position'],
    // createdAt
    ['invalid createdAt', { createdAt: 'not-a-date' }, 'createdAt'],
    // updatedAt
    ['invalid updatedAt', { updatedAt: 'not-a-date' }, 'updatedAt'],
    // archivedAt
    ['invalid archivedAt', { archivedAt: 'not-a-date' }, 'archivedAt'],
    ['archivedAt missing (null is required instead)', { archivedAt: undefined }, 'archivedAt'],
    // boardNumber
    ['boardNumber too low', { boardNumber: 0 }, 'boardNumber'],
    ['boardNumber not an integer', { boardNumber: 1.5 }, 'boardNumber'],
  ])('rejects %s', (_name, override, field) => {
    expectRejectedAt(WorkItemSchema, { ...validWorkItemBase, ...override }, field);
  });

  // missing required fields

  it.each([
    ['id'],
    ['boardNumber'],
    ['title'],
    ['notes'],
    ['state'],
    ['position'],
    ['createdAt'],
    ['updatedAt'],
    ['archivedAt'],
  ])('rejects a missing required field: %s', (name) => {
    expectRejectedWithout(WorkItemSchema, validWorkItemBase, name);
  });
});

////////////////

describe('CreateWorkItemInputSchema', () => {
  const validCreateInput = {
    title: 'Test Title',
    notes: 'Test Notes',
    state: 'backlog',
  };

  it.each([
    ['nominal', {}, {}],
    ['notes at the maximum length', { notes: 'a'.repeat(NOTES_MAX_LENGTH) }],
    ['notes with leading and trailing whitespace', { notes: '  Test Notes  ' }],
    ['no notes', { notes: undefined }, { notes: '' }],
    ['state blank', { state: undefined }, { state: 'backlog' }],
    ['drops keys that are not in the schema', { admin: true }, {}],
    ['drops boardNumber that is not in the schema', { boardNumber: 1 }, {}],
  ])('accepts %s', (_name, override, overrideExpected = override) => {
    expectAcceptedAs(
      CreateWorkItemInputSchema,
      { ...validCreateInput, ...override },
      { ...validCreateInput, ...overrideExpected },
    );
  });

  it('applies defaults when notes and state are omitted', () => {
    expectAcceptedAs(
      CreateWorkItemInputSchema,
      { title: 'x' },
      { title: 'x', notes: '', state: 'backlog' },
    );
  });

  // failure cases

  it.each([
    ['title non-valid', { title: '   ' }, 'title'],
    ['notes too long', { notes: 'a'.repeat(NOTES_MAX_LENGTH + 1) }, 'notes'],
    ['unknown state', { state: 'unknown' }, 'state'],
  ])('should reject a create work item input with %s', (_name, override, field) => {
    expectRejectedAt(CreateWorkItemInputSchema, { ...validCreateInput, ...override }, field);
  });

  // missing required fields

  it.each([['title']])('rejects a missing required field: %s', (name) => {
    expectRejectedWithout(CreateWorkItemInputSchema, validCreateInput, name);
  });
});

////////////////

describe('UpdateWorkItemInputSchema', () => {
  const validUpdateInput = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    title: 'Test Title',
    notes: 'Test Notes',
  };

  it.each([
    ['nominal', {}, {}],
    ['title undefined', { title: undefined }],
    ['notes at the maximum length', { notes: 'a'.repeat(NOTES_MAX_LENGTH) }],
    ['notes with leading and trailing whitespace', { notes: '  Test Notes  ' }],
    ['notes undefined', { notes: undefined }],
    ['drops keys that are not in the schema', { admin: true }, {}],
    ['drops boardNumber that is not in the schema', { boardNumber: 1 }, {}],
  ])('accepts %s', (_name, override, overrideExpected = override) => {
    expectAcceptedAs(
      UpdateWorkItemInputSchema,
      { ...validUpdateInput, ...override },
      { ...validUpdateInput, ...overrideExpected },
    );
  });

  it('leaves omitted fields absent : title present', () => {
    expectAcceptedAs(UpdateWorkItemInputSchema, { id: '1', title: 'x' });
  });

  it('leaves omitted fields absent : notes present', () => {
    expectAcceptedAs(UpdateWorkItemInputSchema, { id: '1', notes: 'x' });
  });

  it('leaves omitted fields absent : notes and title not present', () => {
    expectAcceptedAs(UpdateWorkItemInputSchema, { id: '1' });
  });

  // failure cases

  it.each([
    ['id invalid', { id: '' }, 'id'],
    ['title non-valid', { title: 'a'.repeat(TITLE_MAX_LENGTH + 1) }, 'title'],
    ['notes too long', { notes: 'a'.repeat(NOTES_MAX_LENGTH + 1) }, 'notes'],
  ])('should reject an update work item input with %s', (_name, override, field) => {
    expectRejectedAt(UpdateWorkItemInputSchema, { ...validUpdateInput, ...override }, field);
  });

  // missing required fields

  it.each([['id']])('rejects a missing required field: %s', (name) => {
    expectRejectedWithout(UpdateWorkItemInputSchema, validUpdateInput, name);
  });
});

////////////////

describe('MoveWorkItemInputSchema', () => {
  const validMoveInput = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    state: 'backlog',
    position: 0,
  };

  it.each([
    ['nominal', {}],
    ['drops keys that are not in the schema', { admin: true }, {}],
    ['drops boardNumber that is not in the schema', { boardNumber: 1 }, {}],
    ['non-default values', { state: 'in_progress', position: 3 }],
  ])('accepts %s', (_name, override, overrideExpected = override) => {
    expectAcceptedAs(
      MoveWorkItemInputSchema,
      { ...validMoveInput, ...override },
      { ...validMoveInput, ...overrideExpected },
    );
  });

  // failure cases

  it.each([
    ['id invalid', { id: '' }, 'id'],
    ['unknown state', { state: 'unknown' }, 'state'],
    ['position invalid', { position: -1 }, 'position'],
    ['position non-int', { position: 1.5 }, 'position'],
  ])('should reject a move work item input with %s', (_name, override, field) => {
    expectRejectedAt(MoveWorkItemInputSchema, { ...validMoveInput, ...override }, field);
  });

  // missing required fields

  it.each([['id'], ['state'], ['position']])('rejects a missing required field: %s', (name) => {
    expectRejectedWithout(MoveWorkItemInputSchema, validMoveInput, name);
  });
});

////////////////

describe('BoardSchema', () => {
  const emptyBoard = { backlog: [], todo: [], in_progress: [], blocked: [], done: [] };

  it('accepts a board with every column present', () => {
    expectAcceptedAs(BoardSchema, { ...emptyBoard, backlog: [validWorkItemBase] });
  });

  it('accepts a board with a duplicated item in column', () => {
    expectAcceptedAs(BoardSchema, {
      ...emptyBoard,
      backlog: [validWorkItemBase, validWorkItemBase],
    });
  });

  it('does not check that an item state matches its column', () => {
    expectAcceptedAs(BoardSchema, { ...emptyBoard, todo: [validWorkItemBase] });
  });

  // failure cases

  it('rejects a bad item inside a column, at the nested path', () => {
    expectRejectedAt(
      BoardSchema,
      { ...emptyBoard, done: [{ ...validWorkItemBase, title: '' }] },
      'done',
      0,
      'title',
    );
  });

  it('rejects a board with a missing column', () => {
    expectRejectedAt(BoardSchema, { backlog: [], todo: [], in_progress: [], blocked: [] }, 'done');
  });
});
