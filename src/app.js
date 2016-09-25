import { abs, buildArray, existy, isUpper } from './helpers';
import { testLN1, testPagina1, testLN2, testPagina2 } from './dataSets';

/**
 * Returns an array of words from the news.
 * @param news: Object. The props of the object must contain strings
 */
const parsedWords = news =>
  Object.keys(news)
  // WEIRD: I'm changing the subtitle to lowercase to avoid mistakes
    .map(e => e === 'subtitle' ? news[e].toLowerCase() : news[e])
    .join()
    .split(new RegExp('\"|,|-|›| '))
    .map(e => e.trim())
    .map((e, i, arr) => {
      // Change words that begin a sentence to lowercase if
      // it has a period and is not a number
      if (e.includes('.') && isNaN(Number(e[0]))) {
        const res = e
          .concat(arr[i + 1])
          .split('.')
          .filter(e => e.length)
          .map((e, i) => i !== 0 ? e.toLowerCase() : e);

        arr.splice(i + 1, 1);
        return res;
      }
      return e;
    })
    .join()
    .split(',')
    .filter(e => e.length);

const wordsP = parsedWords(testPagina1);
const wordsLN = parsedWords(testLN1);

////////////////////////////////////////////////////////////////////////
// Word counting operations ////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////

/**
 * Return an array of words with a `count` prop with
 * the appearance of the word
 * @param names: Array
 */
const getWordsCount = names =>
  buildArray(names
    .reduce((res, e) => {
      if (res.hasOwnProperty(e)) {
        res[e] = res[e] + 1;
      }

      if (!res.hasOwnProperty(e)) {
        res[e] = 1;
      }

      return res;
    }, {}))
    .sort((a, b) => a.count - b.count);

/**
 * Return an array of words when the is more than
 * one appearance and there are no words from the
 * skipped list
 * @param names: Array
 */
const getRelevantWordsCount = names =>
  names
    .filter(elem => elem.count !== 1)
    .filter(e => skippedWords.indexOf(e.name) === -1)
    .sort((a, b) => a.count - b.count);

////////////////////////////////////////////////////////////////////////
// Proper nouns counting operations ////////////////////////////////////
////////////////////////////////////////////////////////////////////////

/**
 * Returns an array of proper nouns from the list of words.
 * Any word that starts with an uppercase will appear on the list
 * except from the ones that start a sentence which are removed
 * in the parsedWords fn.
 * TODO: Should probably not do that. Could be considered a side effect
 * @param names: Array
 */
const getNames = names =>
  names
    .reduce((res, e, i, arr) => {
      if (isUpper(e) && existy(arr[i - 1]) && !isUpper(arr[i - 1])) {
        res.push(e);
        return res;
      }

      if (isUpper(e) && existy(arr[i - 1]) && isUpper(arr[i - 1])) {
        res[res.length - 1] = res[res.length - 1] + ' ' + e;
        return res;
      }

      return res;
    }, []);

/**
 * Returns and object with proper nouns and
 * the number of appearances of each
 * @param names: Array
 */
const getNamesCount = names => getWordsCount(getNames(names));

/**
 * Remove repeated words. Return the one that includes all the rest
 * and has the greatest number and remove all repeated ones.
 * @param names: Array
 */
const reduceNames = names =>
  getNamesCount(names)
    .sort((curr, prev) => curr.name.length - prev.name.length)
    .reduce((res, e, i, arr) => {
      const wordCount = arr.reduce((sum, elem) => elem.name.includes(e.name)
        ? sum + elem.count
        : sum, 0);

      const wordSynonyms =
        arr
          .filter(elem => elem.name.includes(e.name))
          .filter(elem => elem.name !== e.name)
          .map(elem => elem.name);

      const result = {
        name: e.name,
        synonyms: wordSynonyms,
        count: wordCount
      };

      res.push(result);
      return res;
    }, [])
    .sort((curr, prev) => curr.name.length - prev.name.length)
    .filter((e, i, arr) => !arr.some(elem => elem.synonyms.indexOf(e.name) !== -1));

/**
 * Returns an array of words with more than
 * one appearance.
 * @param names
 */
const getRelevantNames = names =>
  reduceNames(names)
    .filter(elem => elem.count !== 1)
    .sort((a, b) => a.count - b.count);

////////////////////////////////////////////////////////////////////////
// Numbers counting operations /////////////////////////////////////////
////////////////////////////////////////////////////////////////////////

const getNumbers = names =>
  names
  // WEIRD: Checks if the first character is a number to bring dates and hours
    .filter(e => !isNaN(Number(e[0])));

const getNumbersCount = numbers => getWordsCount(getNumbers(numbers));

////////////////////////////////////////////////////////////////////////
// Analysis operations /////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////

/**
 * Returns an object of the form [word]: [word appearance percentage]
 * with percentage of how important the word is according to the number
 * of times it appears on the article.
 * @param names
 */
const appearancePercentage = names =>
  names
    .reduce((res, elem) => {
      const total = names.reduce((sum, e) => sum + e['count'], 0);

      const e = {
        name: elem.name,
        synonyms: elem.synonyms,
        percentage: Number((elem.count / total * 100).toFixed(2))
      };

      res.push(e);
      return res;
    }, []);

/**
 * Return n number of elements with the biggest percentages
 * @param list: Array
 * @param n: Number
 */
const filterMostRelevant = (list, n) =>
  appearancePercentage(list)
    .sort((curr, prev) => curr.percentage - prev.percentage)
    .reverse()
    .filter((e, i) => i < n);

/**
 * Return words that are equal into an array with those two elements
 * @param a: Array
 * @param b: Array
 */
const extractEquals = (a, b) =>
  a
    .reduce((res, e) => {
      const isPresent = (e1, e2) => e1.name === e2.name || e2.synonyms.indexOf(e1.name) !== -1 || e1.synonyms.indexOf(e2.name) !== -1;
      const result = [
        b.filter(elem => isPresent(e, elem))[0] || null,
        e
      ];

      res.push(result);
      return res;
    }, []);


/**
 * Its kind of a lying function but here's what it does:
 * Up to this point you have an array with n pair of objects.
 * Each object of a pair contains an array of words that refer to the same word.
 * For example you could have: ['cristina', 'cristina kirchner', 'CFK']
 *
 * All these three words are virtually the same and for each of these
 * groups you will have a percentage. This percentage represents how
 * important this words are to the main subject of the article.
 * You could have for example a 21.44 (this is a big percentage).
 *
 * On the other hand you will have an other object. This object will contain
 * the same data: ['cristina', 'cristina kirchner', 'CFK'] but for
 * an other article from a different journal. This words might be in a different
 * order or with some additions. You could have for instance
 * ['cristina', 'cristina kirchner', 'CFK', 'cristina fernandez de kirchner'] and with
 * this list you will also have a percentage of how important this group of words
 * is for this other article. You could have a 18.22.
 *
 * What the function does is it takes this two values (18.22 and 21.44) and it
 * subtracts one an other an then returns the absolute value of these operation.
 * In this case this would be: 3.22.
 *
 * It will do this for all group of words you have. So you finally will end up with
 * a group of numbers: 3.22, 2.33, 8.22.
 * It will then take the biggest one and will subtract 100 to it and the return its absolute
 * value. In this case: 100 - 8.22 = 91.78 and this is the number it will return.
 *
 * This number is suppose to be the similarity index of both articles.
 *
 * @param list
 */
const buildSimilarityIndex = list =>
  abs(list
      .reduce((res, e) => {
        const firstPercentage = e[0].percentage;
        const secondPercentage = e[1].percentage;

        const diffPercentage = abs(firstPercentage - secondPercentage);

        res.push(diffPercentage);
        return res;
      }, [])
      .reduce((prev, curr) => prev > curr ? prev : curr)
    - 100
  ).toFixed(2);

const pagina = getRelevantNames(wordsP);
const LN = getRelevantNames(wordsLN);

// const pagina = filterMostRelevant(getRelevantNames(wordsP), 3);
// const LN = filterMostRelevant(getRelevantNames(wordsLN), 3);
// console.log(JSON.stringify(extractEquals(pagina, LN), null, 2))

console.log(JSON.stringify(pagina, null, 2))
console.log('------------------------------------')
console.log(JSON.stringify(LN, null, 2))


