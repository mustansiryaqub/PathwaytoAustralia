/**
 * Component Tests
 * Covers: UniversityCard, QuizQuestion rendering and interaction
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { UniversityCard } from '@/components/UniversityCard';
import { QuizQuestion } from '@/components/QuizQuestion';
import type { University, QuizQuestion as QuizQuestionType } from '@/types';

const mockUniversity: University = {
  id: 1,
  name: 'University of Melbourne',
  state: 'Victoria',
  city: 'Melbourne',
  qs_rank_2026: '19',
  afr_rank_2024: '3',
  international_students_count: 16000,
  avg_intl_fees_aud: 48000,
  avg_intl_fees_range_low: 37312,
  avg_intl_fees_range_high: 75696,
  undergrad_entry_atar_equiv: 85,
  postgrad_entry_requirement: 'Masters/Bachelors equivalents',
  scholarship_availability_pct: 35,
  grad_employment_rate_pct: 89,
  grad_employment_salary_median_aud: 72000,
  top_strengths: ['Engineering', 'Computer Science', 'Business'],
  established_year: 1853,
  website: 'unimelb.edu.au',
  logo_url: null,
};

const mockSingleChoiceQuestion: QuizQuestionType = {
  id: 'field_of_study',
  step: 9,
  type: 'single_choice',
  category: 'preferences',
  question: 'What field of study are you most interested in?',
  options: [
    { value: 'Engineering', label: 'Engineering', icon: '⚙️' },
    { value: 'Business', label: 'Business / MBA', icon: '💼' },
    { value: 'IT', label: 'IT / Computer Science', icon: '💻' },
  ],
  required: true,
  weight: 2.5,
};

const mockMultiChoiceQuestion: QuizQuestionType = {
  id: 'preferred_state',
  step: 12,
  type: 'multi_choice',
  category: 'preferences',
  question: 'Which states are you open to?',
  options: [
    { value: 'Victoria', label: 'Victoria', icon: '☕' },
    { value: 'New South Wales', label: 'New South Wales', icon: '🏙️' },
    { value: 'Queensland', label: 'Queensland', icon: '☀️' },
    { value: 'Western Australia', label: 'Western Australia', icon: '🌅' },
  ],
  required: true,
  weight: 1.5,
};

// ── UniversityCard ────────────────────────────────────────────
describe('UniversityCard', () => {
  test('renders university name', () => {
    const { getByText } = render(
      <UniversityCard university={mockUniversity} onPress={jest.fn()} />
    );
    expect(getByText('University of Melbourne')).toBeTruthy();
  });

  test('renders QS rank badge', () => {
    const { getByText } = render(
      <UniversityCard university={mockUniversity} onPress={jest.fn()} />
    );
    expect(getByText('#19')).toBeTruthy();
  });

  test('renders location', () => {
    const { getByText } = render(
      <UniversityCard university={mockUniversity} onPress={jest.fn()} />
    );
    expect(getByText(/Melbourne.*Victoria/)).toBeTruthy();
  });

  test('renders employment rate', () => {
    const { getByText } = render(
      <UniversityCard university={mockUniversity} onPress={jest.fn()} />
    );
    expect(getByText(/89%/)).toBeTruthy();
  });

  test('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByRole } = render(
      <UniversityCard university={mockUniversity} onPress={onPress} />
    );
    fireEvent.press(getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test('shows match score when provided', () => {
    const { getByText } = render(
      <UniversityCard university={mockUniversity} onPress={jest.fn()} matchScore={87.3} />
    );
    expect(getByText('87%')).toBeTruthy();
  });

  test('does not show match score when not provided', () => {
    const { queryByText } = render(
      <UniversityCard university={mockUniversity} onPress={jest.fn()} />
    );
    expect(queryByText(/match/)).toBeNull();
  });

  test('renders initials logo for university', () => {
    const { getByText } = render(
      <UniversityCard university={mockUniversity} onPress={jest.fn()} />
    );
    // "University of Melbourne" → UOM
    expect(getByText('UOM')).toBeTruthy();
  });

  test('shows N/A universities without rank badge', () => {
    const noRankUni = { ...mockUniversity, qs_rank_2026: 'N/A' };
    const { queryByText } = render(
      <UniversityCard university={noRankUni} onPress={jest.fn()} />
    );
    expect(queryByText(/^#/)).toBeNull();
  });
});

// ── QuizQuestion: single_choice ───────────────────────────────
describe('QuizQuestion (single_choice)', () => {
  test('renders the question text', () => {
    const { getByText } = render(
      <QuizQuestion
        question={mockSingleChoiceQuestion}
        value={undefined}
        onChange={jest.fn()}
      />
    );
    expect(getByText('What field of study are you most interested in?')).toBeTruthy();
  });

  test('renders all option labels', () => {
    const { getByText } = render(
      <QuizQuestion
        question={mockSingleChoiceQuestion}
        value={undefined}
        onChange={jest.fn()}
      />
    );
    expect(getByText('Engineering')).toBeTruthy();
    expect(getByText('Business / MBA')).toBeTruthy();
    expect(getByText('IT / Computer Science')).toBeTruthy();
  });

  test('calls onChange with correct value on option press', () => {
    const onChange = jest.fn();
    const { getByText } = render(
      <QuizQuestion
        question={mockSingleChoiceQuestion}
        value={undefined}
        onChange={onChange}
      />
    );
    fireEvent.press(getByText('Engineering'));
    expect(onChange).toHaveBeenCalledWith('Engineering');
  });

  test('shows checkmark when option is selected', () => {
    const { getByText } = render(
      <QuizQuestion
        question={mockSingleChoiceQuestion}
        value="IT"
        onChange={jest.fn()}
      />
    );
    // Checkmark should appear near the IT option
    expect(getByText('✓')).toBeTruthy();
  });
});

// ── QuizQuestion: multi_choice ────────────────────────────────
describe('QuizQuestion (multi_choice)', () => {
  test('allows selecting multiple options up to 3', () => {
    const onChange = jest.fn();
    const { getByText } = render(
      <QuizQuestion
        question={mockMultiChoiceQuestion}
        value={['Victoria', 'New South Wales']}
        onChange={onChange}
      />
    );
    fireEvent.press(getByText('Queensland'));
    expect(onChange).toHaveBeenCalledWith(
      expect.arrayContaining(['Victoria', 'New South Wales', 'Queensland'])
    );
  });

  test('deselects when pressing an already-selected option', () => {
    const onChange = jest.fn();
    const { getByText } = render(
      <QuizQuestion
        question={mockMultiChoiceQuestion}
        value={['Victoria', 'New South Wales']}
        onChange={onChange}
      />
    );
    fireEvent.press(getByText('Victoria'));
    expect(onChange).toHaveBeenCalledWith(['New South Wales']);
  });

  test('does not allow selecting a 4th option', () => {
    const onChange = jest.fn();
    const { getByText } = render(
      <QuizQuestion
        question={mockMultiChoiceQuestion}
        value={['Victoria', 'New South Wales', 'Queensland']}
        onChange={onChange}
      />
    );
    fireEvent.press(getByText('Western Australia'));
    // onChange should NOT be called because limit is reached
    expect(onChange).not.toHaveBeenCalled();
  });

  test('displays selection count', () => {
    const { getByText } = render(
      <QuizQuestion
        question={mockMultiChoiceQuestion}
        value={['Victoria', 'New South Wales']}
        onChange={jest.fn()}
      />
    );
    expect(getByText('2/3 selected')).toBeTruthy();
  });
});
