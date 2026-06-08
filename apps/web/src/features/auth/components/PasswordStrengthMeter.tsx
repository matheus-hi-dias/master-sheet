import { useEffect, useState } from 'react';

type PasswordStrengthMeterProps = {
  password: string;
};

type ZxcvbnResult = {
  score: number;
  feedback: {
    warning: string;
  };
};

type ZxcvbnFn = (password: string) => ZxcvbnResult;

let zxcvbnPromise: Promise<ZxcvbnFn> | null = null;
let zxcvbnFn: ZxcvbnFn | null = null;

async function loadZxcvbn() {
  if (zxcvbnFn) {
    return zxcvbnFn;
  }

  if (!zxcvbnPromise) {
    zxcvbnPromise = import('zxcvbn').then(module => {
      const fn = (module.default ?? module) as ZxcvbnFn;
      zxcvbnFn = fn;
      return fn;
    });
  }

  return zxcvbnPromise;
}

const strengthLabels = [
  'Muito fraca',
  'Fraca',
  'Razoavel',
  'Forte',
  'Muito forte',
];

const strengthColors = [
  'bg-danger',
  'bg-danger',
  'bg-gold',
  'bg-emerald-500',
  'bg-emerald-400',
];

export function PasswordStrengthMeter({
  password,
}: PasswordStrengthMeterProps) {
  const [analysis, setAnalysis] = useState<{
    password: string;
    result: ZxcvbnResult;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (!password) {
      return;
    }

    loadZxcvbn()
      .then(scorePassword => {
        if (!isMounted) {
          return;
        }

        setAnalysis({ password, result: scorePassword(password) });
      })
      .catch(() => {
        if (isMounted) {
          setAnalysis(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [password]);

  if (!password) {
    return (
      <div className="mt-1.5">
        <p className="text-[11px] text-text-muted">Forca da senha: -</p>
        <div className="mt-1 flex gap-1.5">
          {Array.from({ length: 5 }).map((_, index) => (
            <span key={index} className="h-1.5 w-full rounded-full bg-border" />
          ))}
        </div>
      </div>
    );
  }

  const currentResult =
    analysis?.password === password ? analysis.result : null;
  const score = currentResult?.score ?? 0;
  const warning = currentResult?.feedback?.warning ?? '';

  return (
    <div className="mt-1.5">
      <p className="text-[11px] text-text-muted">
        Forca da senha:{' '}
        <span className="font-semibold">{strengthLabels[score]}</span>
      </p>
      <div className="mt-1 flex gap-1.5">
        {Array.from({ length: 5 }).map((_, index) => (
          <span
            key={index}
            className={
              'h-1.5 w-full rounded-full transition-colors duration-200 ' +
              (index <= score ? strengthColors[score] : 'bg-border')
            }
          />
        ))}
      </div>
      {warning ? (
        <p className="mt-1 text-[11px] text-text-muted">{warning}</p>
      ) : null}
    </div>
  );
}
