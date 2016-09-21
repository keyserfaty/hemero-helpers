import { upperList } from './constants';

export const existy = arg => arg != null;
export const isUpper = elem => upperList.indexOf(elem[0]) !== -1;
export const buildArray = obj =>
  Object.keys(obj)
    .reduce((res, key) => {
      const e = {
        name: key,
        count: obj[key]
      };

      res.push(e);
      return res;
    }, []);

export const buildObject = arr =>
  arr
    .reduce((res, elem) => {
      res[elem.name] = elem.count;
      return res;
    }, {});

export const abs = x => x < 0 ? -x : x;

/**
 * Stolen mostly from https://github.com/simple-statistics/simple-statistics
 */
export const sum = (x) => {
  var sum = 0;
  var errorCompensation = 0;
  var correctedCurrentValue;
  var nextSum;

  for (var i = 0; i < x.length; i++) {
    correctedCurrentValue = x[i] - errorCompensation;
    nextSum = sum + correctedCurrentValue;
    errorCompensation = nextSum - sum - correctedCurrentValue;
    sum = nextSum;
  }

  return sum;
};

/**
 * The mean, _also known as average_,
 * is the sum of all values over the number of values.
 * This is a [measure of central tendency](https://en.wikipedia.org/wiki/Central_tendency):
 * a method of finding a typical or central value of a set of numbers.
 *
 * This runs on `O(n)`, linear time in respect to the array
 *
 * @param {Array<number>} x input values
 * @returns {number} mean
 * @example
 * mean([0, 10]); // => 5
 */
export const mean = (x) => {
  if (x.length === 0) { return NaN; }
  return sum(x) / x.length;
};

/**
 * [Sample covariance](https://en.wikipedia.org/wiki/Sample_mean_and_sampleCovariance) of two datasets:
 * how much do the two datasets move together?
 * x and y are two datasets, represented as arrays of numbers.
 *
 * @param {Array<number>} x first input
 * @param {Array<number>} y second input
 * @returns {number} sample covariance
 * @example
 * sampleCovariance([1, 2, 3, 4, 5, 6], [6, 5, 4, 3, 2, 1]); // => -3.5
 */
export const sampleCovariance = (x, y) => {
  if (x.length <= 1 || x.length !== y.length) {
    return NaN;
  }

  var xmean = mean(x),
    ymean = mean(y),
    sum = 0;

  for (var i = 0; i < x.length; i++) {
    sum += (x[i] - xmean) * (y[i] - ymean);
  }

  var besselsCorrection = x.length - 1;

  return sum / besselsCorrection;
};

/**
 * The sum of deviations to the Nth power.
 * When n=2 it's the sum of squared deviations.
 * When n=3 it's the sum of cubed deviations.
 *
 * @param {Array<number>} x
 * @param {number} n power
 * @returns {number} sum of nth power deviations
 * @example
 * var input = [1, 2, 3];
 * // since the variance of a set is the mean squared
 * // deviations, we can calculate that with sumNthPowerDeviations:
 * var variance = sumNthPowerDeviations(input) / input.length;
 */
export const sumNthPowerDeviations = (x, n) => {
  var meanValue = mean(x),
    sum = 0;

  for (var i = 0; i < x.length; i++) {
    sum += Math.pow(x[i] - meanValue, n);
  }

  return sum;
};

/*
 * The [sample variance](https://en.wikipedia.org/wiki/Variance#Sample_variance)
 * is the sum of squared deviations from the mean. The sample variance
 * is distinguished from the variance by the usage of [Bessel's Correction](https://en.wikipedia.org/wiki/Bessel's_correction):
 * instead of dividing the sum of squared deviations by the length of the input,
 * it is divided by the length minus one. This corrects the bias in estimating
 * a value from a set that you don't know if full.
 *
 * References:
 * * [Wolfram MathWorld on Sample Variance](http://mathworld.wolfram.com/SampleVariance.html)
 *
 * @param {Array<number>} x input array
 * @return {number} sample variance
 * @example
 * sampleVariance([1, 2, 3, 4, 5]); // => 2.5
 */
export const sampleVariance = (x) => {
  if (x.length <= 1) { return NaN; }

  var sumSquaredDeviationsValue = sumNthPowerDeviations(x, 2);
  var besselsCorrection = x.length - 1;

  return sumSquaredDeviationsValue / besselsCorrection;
};

/**
 * The [standard deviation](http://en.wikipedia.org/wiki/Standard_deviation)
 * is the square root of the variance.
 *
 * @param {Array<number>} x input array
 * @returns {number} sample standard deviation
 * @example
 * sampleStandardDeviation([2, 4, 4, 4, 5, 5, 7, 9]).toFixed(2);
 * // => '2.14'
 */
export const sampleStandardDeviation = (x) => {
  var sampleVarianceX = sampleVariance(x);
  if (isNaN(sampleVarianceX)) { return NaN; }
  return Math.sqrt(sampleVarianceX);
};

/**
 * The [correlation](http://en.wikipedia.org/wiki/Correlation_and_dependence) is
 * a measure of how correlated two datasets are, between -1 and 1
 *
 * @param {Array<number>} x first input
 * @param {Array<number>} y second input
 * @returns {number} sample correlation
 * @example
 * sampleCorrelation([1, 2, 3, 4, 5, 6], [2, 2, 3, 4, 5, 60]).toFixed(2);
 * // => '0.69'
 */
export const sampleCorrelation = (x, y) => {
  const cov = sampleCovariance(x, y),
    xstd = sampleStandardDeviation(x),
    ystd = sampleStandardDeviation(y);

  return cov / xstd / ystd;
};